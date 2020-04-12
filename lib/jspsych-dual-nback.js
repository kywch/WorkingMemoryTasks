/**
 * jspsych-dual-nback-stim
 * Kyoung whan Choe (https://github.com/kywch/)
 *
 * plugin for presenting audiovisual stimuli and getting keyboard responses
 *
 **/

jsPsych.plugins["dual-nback-stim"] = (function() {

    var plugin = {};

    jsPsych.pluginAPI.registerPreload('dual-nback-stim', 'auditory', 'audio');

    plugin.info = {
        name: 'dual-nback-stim',
        description: '',
        parameters: {
            grid_square_size: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Grid square size',
                default: 100,
                description: 'The width and height in pixels of each square in the grid.'
            },
            target_color: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Target color',
                default: "#999",
                description: 'The color of the target square.'
            },
            background_color: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Background color',
                default: "#fff",
                description: 'The default color of the target square.'
            },
            visual: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Visual',
                array: true,
                default: undefined,
                description: 'The location of the visual stimulus. The array should be the [row, column] of the target.'
            },
            visual_stimulation_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Visual stimulation duration',
                default: 500,
                description: 'Stimulus presentation duration.'
            },
            auditory: {
                type: jsPsych.plugins.parameterType.AUDIO,
                pretty_name: 'Auditory',
                default: undefined,
                description: 'The auditory stimulus to be played.'
            },
            visual_detect_key: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Visual detect key',
                default: 'a',
                description: 'Key press that is associated with a matching square (visual).'
            },
            audio_detect_key: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Audio detect key',
                default: 'l',
                description: 'Key press that is associated with a matching letter (auditory).'
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed above the stimulus.'
            },
            trial_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Trial duration',
                default: 3000,
                description: 'Stimulus presentation duration + inter-stimulus interval.'
            },
            response_ends_trial: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Response ends trial',
                default: false,
                description: 'If true, the trial will end when user makes a response.'
            },
            show_feedback: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Show response feedback',
                default: false,
                description: 'If true, show feedback indicating whether the response was correct.'
            },
            feedback_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Feedback duration',
                default: 1000,
                description: 'The length of time in milliseconds to show the feedback (both ON and OFF).'
            },
            correct_response: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Correct response',
                array: true,
                default: undefined,
                description: 'Specify whether the current trial is the target trial. The array should be [visual, auditory] (e.g., [false, true])'
            },
        }
    }

    plugin.trial = function(display_element, trial) {

        var grid = [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ];

        function create_grid(square_size, center_char, target, target_color) {
            if (typeof center_char == 'undefined') {
                center_char = '+';
            }
            var stimulus = "<div id='jspsych-dual-nback-visual' style='margin:auto; display: table; table-layout: fixed; border-spacing:" + square_size / 4 + "px'>";
            for (var i = 0; i < grid.length; i++) {
                stimulus += "<div class='jspsych-dual-nback-visual-row' style='display:table-row;'>";
                for (var j = 0; j < grid[i].length; j++) {
                    stimulus += "<div class='jspsych-dual-nback-visual-stimulus-cell' id='jspsych-dual-nback-visual-stimulus-cell-" + i + "-" + j + "' " +
                        "style='width:" + square_size + "px; height:" + square_size + "px; display:table-cell; " +
                        "vertical-align:middle; text-align: center; font-size:" + square_size / 2 + "px;";
                    if (grid[i][j] == 1) {
                        stimulus += "border: 1px solid black; "
                    }
                    if (typeof target !== 'undefined' && target[0] == i && target[1] == j) {
                        stimulus += "background-color: " + target_color + ";"
                    }
                    stimulus += "'>";
                    if (i == 1 && j == 1) {
                        stimulus += center_char
                    }
                    stimulus += "</div>";
                }
                stimulus += "</div>";
            }
            stimulus += "</div>";
            return stimulus
        };

        // show prompt if there is one
        if (trial.prompt !== null) {
            display_element.innerHTML = trial.prompt;
        }

        // present the visual stimulus
        var visual_stim = create_grid(trial.grid_square_size, '+', trial.visual, trial.target_color);
        display_element.innerHTML += visual_stim;
        jsPsych.pluginAPI.setTimeout(function() {
            for (var i = 0; i < grid.length; i++) {
                for (var j = 0; j < grid[i].length; j++) {
                    display_element.querySelector('#jspsych-dual-nback-visual-stimulus-cell-' + i + '-' + j).style.backgroundColor = trial.background_color;
                    //display_element.querySelector('#jspsych-dual-nback-visual-stimulus-cell-' + i + '-' + j).style.border = '1px solid ' + trial.background_color;
                }
            }
        }, trial.visual_stimulation_duration);

        // present the audio stimulus
        var context = jsPsych.pluginAPI.audioContext();
        if (context !== null) {
            var source = context.createBufferSource();
            source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.auditory);
            source.connect(context.destination);
            startTime = context.currentTime;
            source.start(startTime);
        } else {
            var audio = jsPsych.pluginAPI.getAudioBuffer(trial.auditory);
            audio.currentTime = 0;
            audio.play();
        }

        // handling the key inputs
        var audio_response = {
            rt: -1,
            key: null
        };

        var audioKeyListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: function(input) {
                if (audio_response.key == null)
                    audio_response = input;
            },
            valid_responses: trial.audio_detect_key,
            rt_method: 'date',
            persist: false,
            allow_held_key: false
        });

        var visual_response = {
            rt: -1,
            key: null
        }

        var visualKeyListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: function(input) {
                if (visual_response.key == null)
                    visual_response = input;
            },
            valid_responses: trial.visual_detect_key,
            rt_method: 'date',
            persist: false,
            allow_held_key: false
        });

        // function to end trial when it is time
        function end_trial(correct) {

            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // stop the audio file if it is playing
            // remove end event listeners if they exist
            if (context !== null) {
                source.stop();
                source.onended = function() {}
            } else {
                audio.pause();
                audio.removeEventListener('ended', end_trial);
            }

            // kill keyboard listeners
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // gather the data to store for the trial
            var trial_data = {
                "visual_loc": trial.visual,
                "visual_detect_key": visual_response.key,
                "visual_detect_rt": visual_response.rt,
                "audio_stim": trial.auditory,
                "audio_detect_key": audio_response.key,
                "audio_detect_rt": audio_response.rt,
                "show_feedback": trial.show_feedback,
                "correct": correct
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.finishTrial(trial_data);
        };

        // check the values of correct_response
        if ((typeof trial.correct_response !== 'undefined') &&
            ((trial.correct_response[0] == null) || (trial.correct_response[0] == null))) {
            trial.correct_response = undefined;
        }

        // end trial if time limit is set
        if (typeof trial.correct_response == 'undefined') {
            jsPsych.pluginAPI.setTimeout(function() {
                // set the correct var to null
                end_trial(null);
            }, trial.trial_duration);

        } else {
            jsPsych.pluginAPI.setTimeout(function() {
                if ((trial.correct_response[0] == (visual_response.rt > 0)) && (trial.correct_response[1] == (audio_response.rt > 0))) {
                    var flag_correct = true;
                    var feedback = 'O';
                } else {
                    var flag_correct = false;
                    var feedback = '<font color=red>X</font>';
                }
                if (trial.show_feedback == true) {
                    // show the feedback for a set duration
                    // show prompt if there is one
                    if (trial.prompt !== null) {
                        display_element.innerHTML = trial.prompt;
                    }
                    display_element.innerHTML += create_grid(trial.grid_square_size, feedback);
                    // finish the current trial and move on to the next trial
                    jsPsych.pluginAPI.setTimeout(function() {
                        // display nothing the empty grid & fixation point
                        if (trial.prompt !== null) {
                            display_element.innerHTML = trial.prompt;
                        }
                        display_element.innerHTML += create_grid(trial.grid_square_size);
                        jsPsych.pluginAPI.setTimeout(function() {
                            end_trial(flag_correct);
                        }, trial.feedback_duration / 2);
                    }, trial.feedback_duration / 2);
                } else {
                    end_trial(flag_correct);
                }
            }, trial.trial_duration);
        }
    };

    return plugin;
})();
