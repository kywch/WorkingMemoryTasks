/**
 * fast_rating_street.js
 * Kyoung whan Choe (https://github.com/kywch/)
 *
 * showing images for fast rating
 *
 **/

/*
 * Generic task variables
 */
var sbjId = ""; // mturk id
var task_id = ""; // the prefix for the save file -- the main seq
var data_dir = "";
var flag_debug = false;

/*
 * Task-specific variables
 */
//var num_digits = 3 // this sets the difficulty
var curr_stimSeq = []; // a series of numbers to display
var stimSeq_html = []; // stimSeq is converted into HTML
var singleStim_dur = 1000;
var isiGap_dur = 1000;
var feedback = [];
var trial_number = 0;
var corr_history = [];
var rt_history = [];
var max_level = 0;

// these urls must be checked
var instr_url = 'https://users.rcc.uchicago.edu/~kywch/FIREst_201908_pilot/instructions/preference/';
var save_url = 'https://users.rcc.uchicago.edu/~kywch/BDS_201909/save_data.php';

/*
 * Helper functions
 */

var arraysEqual = function (arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (var i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}

var setStims = function (num_digits) {
    if (num_digits > 9) {
        var nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    } else {
        var nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    }
    curr_stimSeq = jsPsych.randomization.sampleWithoutReplacement(nums, num_digits);
    stimSeq_html = [];
    for (var ii = 0; ii < num_digits; ii++) {
        stimSeq_html.push('<div class = centerbox><div class = digit-span-text>' +
            curr_stimSeq[ii] + '</div></div>');
    }
}

var getTestText = function () {
    return '<div class = centerbox><div class = center-text>' + digit_sequence[corr_history.length] + ' Digits</p></div>';
}

var getStims = function () {
    return stimSeq_html;
}

var getFeedback = function () {
    return ['<div class = centerbox><div class = center-text>' + feedback + '</div></div>'];
}

function save_data() { // CHECK THE URL before use
    if (flag_debug) {
        console.log("Save data function called.");
        console.log(jsPsych.data.get().json());
    }
    jQuery.ajax({
        type: 'post',
        cache: false,
        url: save_url, // this is the path to the above PHP script
        data: {
            data_dir: data_dir,
            task_id: task_id,
            sbj_id: sbjId,
            sess_data: jsPsych.data.get().json()
        }
    });
}


/*
 * Instruction page -> import image instructions and display
 */
function generate_instruction_page(instr_url) {

    var BDS_instructions_page = {
        type: 'instructions',
        pages: [
            '<img class="resize" src="' + instr_url + 'Slide1.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide2.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide3.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide4.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide5.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide6.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide7.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide8.JPG">',
            '<img class="resize" src="' + instr_url + 'Slide9.JPG">',
            '<div class = centerbox><p class = block-text>You can read the instruction again by clicking the <strong>Previous</strong> button.</p>' +
            '<p class = block-text>Clicking the <strong>Next</strong> button will finish the instruction.</p></div>'
        ],
        data: {
            exp_stage: 'BDS_instructions_page',
            task_id: task_id,
            sbj_id: sbjId
        },
        allow_keys: false,
        show_clickable_nav: true,
        show_page_number: true
    };

    return BDS_instructions_page;
}


function generate_backward_block(digit_sequence) {

    // digit_sequence should be defined somewhere
    if (digit_sequence === undefined) {
        if (flag_debug) {
            console.log("Digit sequence is not defined.");
        }
        var digit_sequence = [3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12];
    }
    console.log("Digit sequence: ", digit_sequence);

    var block_sequence = [];

    var block_start_page = {
        type: 'instructions',
        pages: [
            '<div class = centerbox><p class = block-text>Take a deep breath, and click Next to begin the memory task!</p></div>'
        ],
        allow_keys: false,
        show_clickable_nav: true,
        allow_backward: false,
        show_page_number: false,
        data: {
            exp_stage: 'block_start_instruction',
            task_id: task_id,
            sbj_id: sbjId
        },
        on_finish: function () {
            corr_history = []; // curr_trial = corr_history.length
            rt_history = [];
        }
    };
    block_sequence.push(block_start_page);

    for (var ii = 0; ii < digit_sequence.length; ii++) {

        var trial_start_page = {
            type: 'html-keyboard-response',
            is_html: true,
            stimulus: function () {
                return '<div class = centerbox><div class = center-text>' + digit_sequence[corr_history.length] + ' Digits</p></div>';
            },
            data: {
                exp_stage: "trial_start_page_" + ii.toString()
            },
            choices: 'none',
            stimulus_duration: 1000,
            trial_duration: 2000,
            response_ends_trial: false,
            on_finish: function () {
                setStims(digit_sequence[corr_history.length]);
                if (flag_debug) {
                    console.log('Curr digits and stimSeq: ', digit_sequence[corr_history.length], curr_stimSeq);
                }
            }
        };
        block_sequence.push(trial_start_page);

        // show_digits
        var show_digits_page = {
            type: 'multi-html-noresp',
            stimulus: getStims,
            stimulus_duration: singleStim_dur,
            isigap_duration: isiGap_dur,
            data: {
                exp_stage: "show_digits_page_" + ii.toString()
            },
            on_finish: function () {
                jsPsych.data.addDataToLastTrial({
                    "stimSeq": curr_stimSeq
                })
            }
        };
        block_sequence.push(show_digits_page);

        // get_response
        var numpad_response_page = {
            type: 'numpad-response',
            post_trial_duration: 500,
            data: {
                exp_stage: "get_backward_response_" + ii.toString()
            },
            on_finish: function (data) {
                response = data.digit_response;
                rt_history.push(data.rt);

                var correct = arraysEqual(response.reverse(), curr_stimSeq);
                corr_history.push(correct);
                if (correct) {
                    feedback = '<span style="color:green">Correct!</span>';
                    if (max_level < digit_sequence[corr_history.length]) {
                        max_level = digit_sequence[corr_history.length];
                    }
                } else {
                    feedback = '<span style="color:red">Incorrect</span>';
                }
                /*
                    Staircasing: 
                    Single correct -- increase one digits
                    Two incorrect responses -- decrease one digit
                if (correct) {
                    feedback = '<span style="color:green">Correct!</span>';
                    num_digits = num_digits + 1;
                    if (flag_debug) {
                        console.log('Correct! increase one digit');
                    }
                } else {
                    feedback = '<span style="color:red">Incorrect</span>';
                    if (corr_history[corr_history.length - 2] == false && digit_history[digit_history.length - 2] == num_digits) {
                        // two incorrect responses
                        if (flag_debug) {
                            console.log('Two incorrects! decrease one digit');
                        }
                        if (num_digits > 2) {
                            // 2 is the absolute floor
                            num_digits = num_digits - 1;
                        } else {
                            num_digits = 2;
                        }
                    } else {
                        if (flag_debug) {
                            console.log('One incorrect! keep the digit');
                        }
                    }
                }
                */

                jsPsych.data.addDataToLastTrial({
                    "stimSeq": curr_stimSeq,
                    "condition": "reverse",
                    "correct": correct
                });
            }
        };
        block_sequence.push(numpad_response_page);

        // feedback, click to continue
        var feedback_page = {
            type: 'instructions',
            pages: getFeedback,
            allow_keys: false,
            show_clickable_nav: true,
            allow_backward: false,
            show_page_number: false,
            data: {
                exp_stage: "feedback_page_" + ii.toString()
            },
            on_finish: function () {
                save_data();
            }
        };
        block_sequence.push(feedback_page);
    }

    return block_sequence;

}
