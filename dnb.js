/**
 * dnb.js
 * Kyoung whan Choe (https://github.com/kywch/)
 *
 * plugin for presenting audiovisual stimuli and getting keyboard responses
 *
 **/

/*
 * Generic task variables
 */
var sbjId = "";
var flag_debug = true;
var duration_trial = 3000; // ms
var duration_square = 500; // ms

var record_correct = {};
var session_design = [];
var curr_block = 0;

// these urls must be checked
var dnb_instr_url = 'https://raw.githubusercontent.com/kywch/dnb_jsPsych/master/instructions/';
var audio_url = 'https://raw.githubusercontent.com/kywch/dnb_jsPsych/master/sounds/';

/*
 * Helper functions
 */
function get_audio_url(audio_char) { // CHECK THE URL before use
    return audio_url + audio_char + '.wav';
}

/* shuffle is used in many places */
function shuffle(array) {
    let counter = array.length;
    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);
        // Decrease counter by 1
        counter--;
        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function save_data() { // CHECK THE URL before use
    console.log("Save data function called.");
    console.log(jsPsych.data.get().json(true));
    /*
    $.ajax({
        type: 'post',
        cache: false,
        url: 'https://webtask-humanperflab.rhcloud.com/maadm/save_data.php', // this is the path to the above PHP script
        data: {
            sessid: eval("sbjId"),
            taskid: 'maadm1807',
            sess_data: jsPsych.data.dataAsJSON()
        }
    });
    */
}


/*
 * Stimulus definitions
 */
// everyone will get different id <-> stim mapping
var visual_stim = [ // target location in the grid
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2]
];
visual_stim = shuffle([...visual_stim]);
if (flag_debug) {
    console.log("Visual stim: ", visual_stim);
}

var audio_seed = ['c', 'd', 'g', 'k', 'p', 'q', 't', 'v'];
audio_seed = shuffle([...audio_seed]);
if (flag_debug) {
    console.log("Audio stim seeds: ", audio_seed);
}


/*
 * Audio check block
 */
var block_audio_check = [];

var enter_audio_check_page = {
    type: 'audio-keyboard-with-replay',
    prompt: "<div class = centerbox><p class = block-text>" +
        "The task you are about to do requires listening to sounds. Please adjust your sound setting. " +
        "Before going into the main task, we will do a simple task to make sure you can hear the sounds. </p>" +
        "<p class = block-text>In the next pages, press the alphabet key associated with the played sound to proceed. </p> " +
        "<p class = block-text>If you are ready, press <strong>Space bar</strong> key to proceed.</p></div>",
    choices: ['spacebar'],
    data: {
        exp_stage: 'enter_audio_check_page'
    }
};
block_audio_check.push(enter_audio_check_page);

for (var ii = 0; ii < audio_seed.length; ii++) {
    var audio_check_trial = {
        type: 'audio-keyboard-with-replay',
        stimulus: get_audio_url(audio_seed[ii]),
        prompt: "<div class = centerbox><p class = block-text>" +
            "Trial " + (ii + 1) + " / " + audio_seed.length + " : " +
            "Please press the alphabet key you just heard.</p> " +
            "<p class = block-text>To replay, press the <strong>r</strong> key. </p></div>",
        choices: [audio_seed[ii]],
        data: {
            exp_stage: 'audio_check_trial',
            played_audio: audio_seed[ii]
        }
    }
    block_audio_check.push(audio_check_trial);
}


/*
 * N-back instruction page
 */
var dnb_instructions_page = {
    type: 'instructions',
    pages: [
        '<img class="resize" src="' + dnb_instr_url + '1.gif">',
        '<img class="resize" src="' + dnb_instr_url + '2.gif">',
        '<img class="resize" src="' + dnb_instr_url + '3.gif">',
        '<img class="resize" src="' + dnb_instr_url + '4.gif">',
        '<img class="resize" src="' + dnb_instr_url + '5.gif">',
        '<img class="resize" src="' + dnb_instr_url + '6.gif">',
        '<img class="resize" src="' + dnb_instr_url + '7.gif">',
        '<div class = centerbox><p class = block-text>You can read the instruction again by clicking the <strong>Previous</strong> button</p>' +
        '<p class = block-text>Clicking the <strong>Next</strong> button will finish the instruction.</p></div>'
    ],
    data: {
        exp_stage: 'dnb_instructions_page',
        visual_stim: visual_stim, // the shuffled visual stim for reference
        audio_seed: audio_seed // shuffled audio seed for reference
    },
    allow_keys: false,
    show_clickable_nav: true,
    show_page_number: true
};


/*
 * N-back task block
 */
function generate_task_block(block_count) {

    var block_reference = "session_design[" + block_count.toString() + "]";
    var this_block = eval(block_reference);

    block_id = this_block['block_id'];
    sequence = this_block['stim_seq'];
    flag_feedback = (typeof this_block['feedback'] == 'undefined') ? false : this_block['feedback'];

    var block_sequence = [];
    var num_trial = sequence[0].length;

    record_correct[block_id] = [];

    var enter_block_page = {
        type: 'audio-keyboard-with-replay',
        prompt: function() {
            return "<div class = centerbox><br><br><br><p class = very-large>" + this_block['prompt'] + '</p><br>' +
                "<p class = center-block-text>Press <strong>Space bar</strong> key to proceed.</p></div>"
        },
        choices: ['spacebar'],
        data: {
            exp_stage: 'enter_block_page_' + block_id,
            session_design: this_block
        }
    }
    var fixation_page = {
        type: 'dual-nback-stim',
        prompt: "<p>Press <strong>'a'</strong> for a matching square " +
            "and <strong>'l'</strong> for a matching sound.</p>"
    }
    block_sequence.push(enter_block_page);
    block_sequence.push(fixation_page);

    for (var ii = 0; ii < num_trial; ii++) {
        var dnb_trial = {
            type: 'dual-nback-stim',
            trial_duration: duration_trial,
            visual: visual_stim[sequence[0][ii]],
            visual_stimulation_duration: duration_square,
            auditory: get_audio_url(audio_seed[sequence[2][ii]]),
            prompt: "<p>Press <strong>'a'</strong> for a matching square " +
                "and <strong>'l'</strong> for a matching sound.</p>",
            correct_response: [sequence[1][ii], sequence[3][ii]],
            show_feedback: flag_feedback,
            data: {
                exp_stage: block_id + '_trial_' + (ii + 1),
                visual_stimidx: sequence[0][ii],
                visual_corresp: sequence[1][ii],
                audio_stimidx: sequence[2][ii],
                audio_char: audio_seed[sequence[2][ii]],
                audio_corresp: sequence[3][ii]
            },
            on_finish: function(data) {
                var this_block = eval("session_design[curr_block]");
                block_id = this_block["block_id"];
                record_correct[block_id].push(data.correct);
                if (flag_debug) {
                    console.log(data);
                    console.log(block_id + " corrects : ", record_correct[block_id]);
                }
            }
        }
        block_sequence.push(dnb_trial);
    }
    var fixation_page = {
        type: 'dual-nback-stim',
        prompt: "<p>Press <strong>'a'</strong> for a matching square " +
            "and <strong>'l'</strong> for a matching sound.</p>",
        on_finish: function() {
            save_data();
            curr_block += 1;
        }
    }
    block_sequence.push(fixation_page);

    return block_sequence;
}
