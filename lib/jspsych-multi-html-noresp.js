/**
 * jspsych-multi-html-noresp
 * Kyoung whan Choe
 *
 * plugin for displaying a series of html stims without getting the response
 *
 **/


jsPsych.plugins["multi-html-noresp"] = (function () {

  var plugin = {};

  plugin.info = {
    name: 'multi-html-noresp',
    description: '',
    parameters: {
      stimulus: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        array: true,
        pretty_name: 'Stimulus',
        default: undefined,
        description: 'The series of HTML string to be displayed'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the stimulus.'
      },
      stimulus_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimulus duration',
        default: 1000,
        description: 'How long to hide the stimulus.'
      },
      isigap_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Inter-stimulus gap duration',
        default: 1000,
        description: 'How long to show trial before it ends.'
      }

    }
  }

  plugin.trial = function (display_element, trial) {

    // make sure that it is using the fullscreen mode
    var element = document.documentElement;
    var reset_fullscreen = false;
    if (element.requestFullscreen) {
      element.requestFullscreen();
      reset_fullscreen = true;
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
      reset_fullscreen = true;
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
      reset_fullscreen = true;
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
      reset_fullscreen = true;
    }

    // function to end trial when it is time
    var end_trial = function () {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial();
    };

    var showStim = 0;

    function showNextStimulus() {

      // check whether there is any stimulus to display
      if (trial.stimulus.length > showStim) {

        // display stimulus
        var new_html = '<div id="jspsych-multi-html-noresp">' + trial.stimulus[showStim] + '</div>';

        // add prompt
        if (trial.prompt !== null) {
          new_html += trial.prompt;
        }

        // draw
        display_element.innerHTML = new_html;

        // arranging the next stimulus display
        if (trial.stimulus_duration > 0) {
          jsPsych.pluginAPI.setTimeout(function () {
            // after showing the stimulus for stimulus_duration
            // clear the display, or hide the display
            display_element.innerHTML = '';

            // show the next stimulus after the gap
            showStim++;
            if (trial.isigap_duration > 0) {
              jsPsych.pluginAPI.setTimeout(function () {
                showNextStimulus();
              }, trial.isigap_duration);
            } else {
              showNextStimulus();
            }
          }, trial.stimulus_duration);
        } else {
          // strange stimulus duration -- raise an error here
          return;
        }
      } else {
        end_trial();
      }
    }

    // show first stimulus
    showNextStimulus();

  };

  return plugin;
})();
