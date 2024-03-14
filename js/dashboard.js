
var lineChart;

$(document).ready(function () {
    $.get('/getAllEmotionData', function (data) {
   
        let labels = data.data[0].map(row => {
            let date = new Date(row.LogDate);
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().substr(-2)}`;
        });
        let colors = ['#FFDC7B', '#74A8DA', '#F2736D', '#BD678A', '#A390C4', '#30B575', '#36AED7'];
        let emotionLabels = ['Enjoyment', 'Sadness', 'Anger', 'Contempt', 'Disgust', 'Fear', 'Surprise'];
        let datasets = data.data.map((scores, i) => ({
            label: emotionLabels[i], 
            data: scores.slice(-10).map(row => row.EmotionScore),  
            fill: false,
            borderColor: colors[i],
            tension: 0.1
        }));


      
        if (!lineChart) {
            var ctx = document.getElementById('lineChart').getContext('2d');
            lineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels.slice(-10),  
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 1,
                }
            });
        } else {
            
            lineChart.data.labels = labels.slice(-10);  
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




