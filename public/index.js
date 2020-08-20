

document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('form-url-input')
    const errorBox = document.getElementById('error-box')

    function setError(message) {
        if (!message) {
            message = ''
        }
        errorBox.innerHTML = message
    }

    document.getElementById('generate_btn').addEventListener('click', e => {
        const value = urlInput.value
        fetch('/api/url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                originalURL: value,
            })
        })
            .then(res => res.json())
            .then(json => {
                // Clear error
                setError()

                if (!json.id) {
                    throw new Error(json.message || 'Unknown error')
                }


                urlInput.value = ''
                const historyTable = document.getElementById('history-table').getElementsByTagName('tbody')[0];
                const row = historyTable.insertRow(0);
                const cell1 = row.insertCell(0);
                const cell2 = row.insertCell(1);
                const cell3 = row.insertCell(2);
                cell1.innerHTML = json.id;
                cell2.innerHTML = json.url;
                cell3.innerHTML = json.originalURL;
            }).catch(err => {
                setError(err.message)
            });
    })
}, false);
