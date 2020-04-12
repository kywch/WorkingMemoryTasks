/**
 * jspsych-numpad-response
 * Kyoung whan Choe
 *
 * plugin for displaying a numpad stimulus and getting mouse clicks
 *
 **/

jsPsych.plugins["numpad-response"] = (function () {

  var plugin = {};

  plugin.info = {
    name: 'numpad-response',
    description: '',
    parameters: {
      response_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to allow response.'
      },
      post_trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Post trial duration',
        default: null,
        description: 'Duration of pause before proceeding'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed under the button.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, then trial will end when user responds.'
      }
    }
  }

  plugin.trial = function (display_element, trial) {

    // start time
    var trial_onset = performance.now();
    var digit_response = [];
    var click_history = [];

    // function to end trial when it is time
    function end_trial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        "rt": Math.round(performance.now() - trial_onset),
        "digit_response": digit_response,
        'click_history': click_history
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      if (trial.post_trial_duration !== null) {
        jsPsych.pluginAPI.setTimeout(function () {
          jsPsych.finishTrial(trial_data);
        }, trial.post_trial_duration);
      } else {
        jsPsych.finishTrial(trial_data);
      }

    };

    // display stimulus
    var html = '<div id="jspsych-numpad-response"><div class = numbox>' +
      '<button id = button_1 class = "square num-button"><div class = content><div class = numbers>1</div></div></button>' +
      '<button id = button_2 class = "square num-button"><div class = content><div class = numbers>2</div></div></button>' +
      '<button id = button_3 class = "square num-button"><div class = content><div class = numbers>3</div></div></button>' +
      '<button id = button_4 class = "square num-button"><div class = content><div class = numbers>4</div></div></button>' +
      '<button id = button_5 class = "square num-button"><div class = content><div class = numbers>5</div></div></button>' +
      '<button id = button_6 class = "square num-button"><div class = content><div class = numbers>6</div></div></button>' +
      '<button id = button_7 class = "square num-button"><div class = content><div class = numbers>7</div></div></button>' +
      '<button id = button_8 class = "square num-button"><div class = content><div class = numbers>8</div></div></button>' +
      '<button id = button_9 class = "square num-button"><div class = content><div class = numbers>9</div></div></button>' +
      '<button class = clear_button id = "ClearButton" onclick = "clearResponse()">Clear</button>' +
      '<button class = submit_button id = "SubmitButton">Submit Answer</button></div></div>';

    //show prompt if there is one
    if (trial.prompt !== null) {
      html += trial.prompt;
    }
    display_element.innerHTML = html;

    // define button press behavior
    function numberClickListener(evt) {
      var button_id = this.id;
      digit_response.push(button_id.split("_")[1]);
      click_history.push({
        "button": button_id.split("_")[1],
        "rt": Math.round(performance.now() - trial_onset)
      });
      if (flag_debug) {
        console.log(button_id, ' was clicked. ', digit_response, click_history);
      }
    }
    for (var ii = 1; ii < 10; ii++) {
      document.getElementById('button_' + ii.toString()).addEventListener('click', numberClickListener);
    }

    function clearButtonListener(evt) {
      digit_response = [];
      click_history.push({
        "button": 'clear',
        "rt": Math.round(performance.now() - trial_onset)
      });
      if (flag_debug) {
        console.log(button_id, ' was clicked. ', digit_response, click_history);
      }
    }
    document.getElementById('ClearButton').addEventListener('click', clearButtonListener);

    function submitButtonListener(evt) {
      click_history.push({
        "button": 'submit',
        "rt": Math.round(performance.now() - trial_onset)
      });
      end_trial();
    }
    document.getElementById('SubmitButton').addEventListener('click', submitButtonListener);

    // hide image if timing is set
    if (trial.response_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function () {
        display_element.querySelector('#jspsych-numpad-response').style.visibility = 'hidden';
        end_trial();
      }, trial.response_duration);
    }
  };

  return plugin;
})();
