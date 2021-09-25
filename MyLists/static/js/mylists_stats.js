

$(document).ready(function () {
    // --- Canvas Data ---------------------------------------------------------------------------------
    let time_data = $('#time-spent-pie').attr('values').split(', ');

    // --- Sum of the time_data jquery array -----------------------------------------------------------
    let total_ = 0;
    $.each(time_data,function(){total_+=parseFloat(this) || 0;});

    // --- Time sent pie graph -------------------------------------------------------------------------
    let config_pie = {
        type: 'bar',
        data: {
            labels: ['Series', 'Anime', 'Movies', 'Games', 'Books'],
            datasets: [{
                data: time_data,
                backgroundColor: ['#216e7d', '#945141', '#8c7821', '#196219', '#5d4683'],
                borderColor: '#000000',
                borderWidth: 1,
            }],
        },
        options: {
            events: false,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        fontColor: 'lightgray',
                        fontSize: 16,
                    },
                }],
              xAxes: [{
                    ticks: {
                        fontColor: 'lightgray',
                        fontSize: 16,
                    },
                }]
            },
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Time (hours) spent per media type',
                position: 'top',
                fontColor: '#e2e2e2',
                fontSize: 18,
                fontStyle: 'normal',
            },
            animation: {
                duration: 1,
                onComplete: function () {
                    let chartInstance = this.chart,
                        ctx = chartInstance.ctx;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';

                    this.data.datasets.forEach(function (dataset, i) {
                        let meta = chartInstance.controller.getDatasetMeta(i);
                        meta.data.forEach(function (bar, index) {
                            let data = dataset.data[index];
                            let percent = String(Math.round(dataset.data[index]/total_*100)) + "%";
                            ctx.fillStyle = 'lightgrey';
                            ctx.font = "16px 'Helvetica Neue', Helvetica, Arial, sans-serif";
                            data = numberWithSpaces(data);
                            ctx.fillText(data+" ("+percent+")", bar._model.x, bar._model.y - 5);
                        });
                    });
                }
            }
        }
    };
    let ctx_pie = document.getElementById('media-time').getContext('2d');
    new Chart(ctx_pie, config_pie);

    // --- Add space for each 1 000 10 000 etc... ------------------------------------------------------
    function numberWithSpaces(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
});
