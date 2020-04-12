/**
 * jspsych-audio-keyboard-with-replay
 * Kyoung whan Choe (https://github.com/kywch/)
 *
 * plugin for playing an audio file and getting a keyboard response
 * with replay key -- to make sure that Ps can listen to the sound
 *
 **/

jsPsych.plugins["audio-keyboard-with-replay"] = (function() {

    var plugin = {};

    jsPsych.pluginAPI.registerPreload('audio-keyboard-with-replay', 'stimulus', 'audio');

    plugin.info = {
        name: 'audio-keyboard-response',
        description: '',
        parameters: {
            stimulus: {
                type: jsPsych.plugins.parameterType.AUDIO,
                pretty_name: 'Stimulus',
                default: undefined,
                description: 'The audio to be played.'
            },
            choices: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Choices',
                array: true,
                default: jsPsych.ALL_KEYS,
                description: 'The keys the subject is allowed to press to respond to the stimulus.'
            },
            replay_key: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Replay key',
                default: 'r',
                description: 'The keys the subject is allowed to press to replay the sound.'
            },
            prompt: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Prompt',
                default: null,
                description: 'Any content here will be displayed below the stimulus.'
            },
            trial_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Trial duration',
                default: null,
                description: 'The maximum duration to wait for a response.'
            },
            response_ends_trial: {
                type: jsPsych.plugins.parameterType.BOOL,
                pretty_name: 'Response ends trial',
                default: true,
                description: 'If true, the trial will end when user makes a response.'
            },
            inter_trial_interval: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Inter trial interval',
                default: 1000,
                description: 'An interval between the end of current trial and the start of next trial.'
            },
        }
    }

    plugin.trial = function(display_element, trial) {

        // setup stimulus
        var context = jsPsych.pluginAPI.audioContext();
        if (context !== null) {
            var source = context.createBufferSource();
            source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
            source.connect(context.destination);
        } else {
            var audio = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
        }

        // show prompt if there is one
        if (trial.prompt !== null) {
            display_element.innerHTML = trial.prompt;
        }

        // store response
        var response = {
            rt: null,
            key: null
        };

        // function to end trial when it is time
        function end_trial() {

            // kill any remaining setTimeout handlers
            jsPsych.pluginAPI.clearAllTimeouts();

            // stop the audio file if it is playing
            // remove end event listeners if they exist
            if (context !== null) {
                source.stop();
            } else {
                audio.pause();
            }

            // kill keyboard listeners
            jsPsych.pluginAPI.cancelAllKeyboardResponses();

            // gather the data to store for the trial
            if (context !== null && response.rt !== null) {
                response.rt = Math.round(response.rt * 1000);
            }
            var trial_data = {
                "rt": response.rt,
                "stimulus": trial.stimulus,
                "key_press": response.key
            };

            // clear the display
            display_element.innerHTML = '';

            // move on to the next trial
            jsPsych.pluginAPI.setTimeout(function() {
                jsPsych.finishTrial(trial_data);
            }, trial.inter_trial_interval);
        };

        // function to handle responses by the subject
        var after_response = function(info) {

            // only record the first response
            if (response.key == null) {
                response = info;
            }

            if (trial.response_ends_trial) {
                end_trial();
            }
        };

        // start audio
        if (context !== null) {
            startTime = context.currentTime;
            source.start(startTime);
        } else {
            audio.play();
        }

        // start the response listener
        if (context !== null) {
            var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_response,
                valid_responses: trial.choices,
                rt_method: 'audio',
                persist: false,
                allow_held_key: false,
                audio_context: context,
                audio_context_start_time: startTime
            });
        } else {
            var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: after_response,
                valid_responses: trial.choices,
                rt_method: 'date',
                persist: false,
                allow_held_key: false
            });
        }

        var replay_sound = function(info) {
            // start audio
            if (context !== null) {
                var source = context.createBufferSource();
                source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
                source.connect(context.destination);
                startTime = context.currentTime;
                source.start(startTime);
            } else {
                var audio = jsPsych.pluginAPI.getAudioBuffer(trial.stimulus);
                audio.currentTime = 0;
                audio.play();
            }
        };

        // start the replay key listener
        var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: replay_sound,
            valid_responses: trial.replay_key,
            rt_method: 'date',
            persist: true,
            allow_held_key: false
        });

        // end trial if time limit is set
        if (trial.trial_duration !== null) {
            jsPsych.pluginAPI.setTimeout(function() {
                end_trial();
            }, trial.trial_duration);
        }

    };

    return plugin;
})();
