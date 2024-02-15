// Declare the chart variable outside the AJAX request so it can be accessed later
var lineChart;

$(document).ready(function () {
    $.get('/getAllEmotionData', function (data) {
        // Prepare the data for the chart
        let labels = data.data[0].map(row => {
            let date = new Date(row.LogDate);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().substr(-2)}`;
        });
        let colors = ['#FFDC7B', '#74A8DA', '#F2736D', '#BD678A', '#A390C4', '#30B575', '#36AED7'];
        let emotionLabels = ['Enjoyment', 'Sadness', 'Anger', 'Contempt', 'Disgust', 'Fear', 'Surprise'];
        let datasets = data.data.map((scores, i) => ({
            label: emotionLabels[i], // assign individual label
            data: scores.slice(-10).map(row => row.EmotionScore),  // Only take the last 10 scores
            fill: false,
            borderColor: colors[i],
            tension: 0.1
        }));


        // If the chart doesn't exist, create it
        if (!lineChart) {
            var ctx = document.getElementById('lineChart').getContext('2d');
            lineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels.slice(-10),  // Only take the last 10 labels
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1,
                }
            });
        } else {
            // If the chart already exists, update its data
            lineChart.data.labels = labels.slice(-10);  // Only take the last 10 labels
            lineChart.data.datasets = datasets;
            lineChart.update();
        }
    });
});


$(document).ready(function () {
    $.get('/getRecentLogs', function (data) {
        for (let i = 0; i < data.logs.length; i++) {
            $('#date' + (i + 1)).text(new Date(data.logs[i].date).toLocaleDateString());
            $('#score' + (i + 1)).text(data.logs[i].average);
            $('#session' + (i + 1)).attr('href', '/snapshot?logID=' + data.logs[i].logID);
        }
    });
});




