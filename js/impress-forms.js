/**
 * impress-forms.js
 *
 * impress-forms.js is an extension of the impress.js remote control that sends
 * form data over remote control; it instruments forms that have the class
 * rc-interactive.
 *
 * Copyright 2015- Jacek Kopecky
 *
 * Released under the MIT and GPL Licenses.
 *
 * ------------------------------------------------
 *  author:  Jacek Kopecky
 *  version: 0.0.1
 *  source:  http://github.com/jacekkopecky/impress.js/
 */

/* globals google */

(function(){
    'use strict';

    function instrumentForms(event) {

        var api = event.detail.api;

        console.log("instrumenting forms: " + document.forms.length);

        for (var i=0; i<document.forms.length; i++) {
            var form = document.forms[i];
            if (form.classList.contains("rc-interactive")) {
                // instrument the inputs of this form
                // so that onChange submits the form's data over RC
                for (var j=0; j<form.elements.length; j++) {
                    var input = form.elements[j];
                    input.addEventListener('change', submitForm);
                }
            }

            // todo form.addEventListener('impress:stepenter', ...
            // todo form.addEventListener('impress:stepleave', ...
            // these should send enter and leave, if we have a password, so
            // that clients can disable and enable the right form
        }

        var resetButtons = document.querySelectorAll('.form-reset');
        for (i=0; i<resetButtons.length; i++) {
            resetButtons[i].addEventListener('click', resetForms);
        }

        function submitForm(event) {
            var form = event.target.form;

            var message = { cmd: "form-data", form: form.id, data: {}};

            for (var i=0; i<form.elements.length; i++) {
                var input = form.elements[i];

                if (input.disabled ||
                    !input.name ||
                    input.type === 'reset' ||
                    input.type === 'submit' ||
                    ((input.type === 'checkbox' || input.type === 'radio') && !input.checked)) continue;

                if (input.name in message.data) {
                    message.data[input.name] = [].concat(message.data[input.name], input.value);
                } else {
                    message.data[input.name] = input.value;
                }
            }

            // console.log('sending the following data: ' + JSON.stringify(message, null, 2));
            if (!api.rcSend) {
                console.log("error: api.rcSend() not available, form not submitted");
            } else {
                api.rcSend(message);
            }
        }

        function resetForms(event) {
            var form = event.target.dataset.form;
            var message = { cmd: "reset-form", form: form};
            if (!api.rcSend) {
                console.log("error: api.rcSend() not available, form not reset");
            } else {
                api.rcSend(message);
            }
        }

        document.addEventListener('impressRC:message', receivedMessage);

        function receivedMessage(event) {
            var message = event.detail.message;
            if (!message.cmd) return;

            var form;

            if (message.cmd === "form-data") {
                form = document.getElementById(message.form);
                if (!form || form.tagName !== "FORM") return;

                triggerEvent(form, 'newRCData', event.detail);

            } else if (message.cmd === "reset-form") {

                form = document.getElementById(message.form);
                if (!form || form.tagName !== "FORM") return;

                form.reset();

            } else if (message.cmd === "client-gone") {

                for (var i=0; i<document.forms.length; i++) {
                    form = document.forms[i];
                    if (form.classList.contains("rc-interactive")) {
                        // instrument the inputs of this form
                        // so that onChange submits the form's data over RC
                        triggerEvent(form, 'clientGone', event.detail);
                    }
                }
            }
        }

        [].slice.call(document.querySelectorAll('.form-receiver')).forEach(instrumentFormReceiver);

        function instrumentFormReceiver(formReceiver) {
            var chartEl = formReceiver.querySelector('[class~="form-chart"]');
            var form = document.getElementById(formReceiver.dataset.form);

            if (!chartEl) return console.log("no chart element!");
            if (!form) return console.log("no target form!");

            var dataTemplate = [
                ['answer', 'count']
            ];

            var dataHash = {};

            var answerIndex = 0;

            [].slice.call(form.elements).forEach(function(input) {
                if (input.value) {
                    dataTemplate.push([input.value, 0]);
                    dataHash[input.value] = { count: 0, index: answerIndex++ };
                }
            });


            var dataTable = google.visualization.arrayToDataTable(dataTemplate);

            var chart;

            var options = {
                title: form.dataset.title,
                animation: {
                    duration: 1000,
                    easing: 'out'
                },
                fontSize: 40,
                vAxis: {
                    baseline: 0,
                    gridlines: {
                        count: 2,
                    },
                    minValue: 0,
                    maxValue: 1
                },
                hAxis: {},
                legend: {
                    position: 'none'
                }
            };

            var answers = [];

            var snapshots = formReceiver.querySelector('[class~="form-snapshots"]');
            if (!snapshots) console.log("no list of snapshots, disabling that functionality");
            var snapshot;

            function initializeChartSnapshot() {
                if (!snapshots) return;
                if (snapshot) snapshot.textContent = formatTime()  + ' ';
                snapshot = document.createElement('a');
                snapshot.target = "_blank";
                snapshot.href = "/";
                snapshot.textContent = "[ o]";
                snapshots.appendChild(snapshot);
            }

            function updateChartSnapshot() {
                if (!snapshots) return;
                if (!snapshot) initializeChartSnapshot();
                snapshot.href = chart.getImageURI();
                snapshots.scrollLeft = snapshots.clientWidth;
            }

            var snapButton = formReceiver.querySelector('[class~="form-snap"]');
            if (snapButton) snapButton.addEventListener('click', function() {
                initializeChartSnapshot();
                updateChartSnapshot();
            });

            form.addEventListener('reset', function() {
                answers = [];
                initializeChartSnapshot();
                drawChart();
            });

            form.addEventListener('newRCData', function(ev) {
                var message = ev.detail.message;
                answers[message['client-id']] = message.data.answer;
                drawChart();
            });

            form.addEventListener('clientGone', function(ev) {
                var message = ev.detail.message;
                delete answers[message['client-id']];
                drawChart();
            });

            function drawChart() {
                var answer;
                for (answer in dataHash) dataHash[answer].count = 0;
                var max = 0;
                for (var k in answers) {
                    if (answers[k] in dataHash) {
                        dataHash[answers[k]].count++;
                        max++;
                    } else {
                        console.log("got unknown answer: " + answers[k]);
                    }
                }
                for (answer in dataHash) {
                    dataTable.setValue(dataHash[answer].index, 1, dataHash[answer].count);
                }
                if (!max) max = 1;

                options.vAxis.maxValue = max;
                options.vAxis.ticks = [0,max];
                options.hAxis.title = '(' + formatTime() + ')';
                if (!chart) {
                    chart = new google.visualization.ColumnChart(chartEl);
                    google.visualization.events.addListener(chart, 'ready', updateChartSnapshot);
                }
                chart.draw(dataTable, options);
            }

            google.setOnLoadCallback(drawChart);
        }

    }

    // tool function from impress
    var triggerEvent = function (el, eventName, detail) {
        var event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, true, true, detail);
        el.dispatchEvent(event);
    };


    function formatTime() {
        var now = new Date();
        return '' + now.getHours() + ':' + ( now.getMinutes() < 10 ? '0' : '' ) + now.getMinutes();
    }

    document.addEventListener('impress:init', instrumentForms);
    document.addEventListener('impressRC:init', instrumentForms);

})();
