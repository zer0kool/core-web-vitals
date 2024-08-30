//Materialize init

var apptabs = document.querySelectorAll('.tabsx');
M.Tabs.init(apptabs, {});

var elems = document.querySelectorAll('.collapsible');
M.Collapsible.init(elems, {});

var mobileMenu = document.querySelector('.fixed-action-btn');
M.FloatingActionButton.init(mobileMenu, {})

var slide = document.querySelectorAll('.modal');
M.Modal.init(slide, {});


document.getElementById('clear').addEventListener('click', function() {
    document.getElementById('search').value = '';
});

// New code for batch processing and settings toggle
document.addEventListener('DOMContentLoaded', function() {
    const batchContainer = document.querySelector('.row.batch');
    const settingsIcon = document.querySelector('span.batchToggle');
    const fetchButton = document.querySelector('button[onclick="processUrls()"]');

    // Hide settings icon initially
    settingsIcon.style.display = 'none';

    // Function to toggle batch container visibility
    function toggleBatchContainer() {
        const isVisible = batchContainer.style.display !== 'none';
        batchContainer.style.display = isVisible ? 'none' : 'block';
        settingsIcon.innerHTML = `
            <i class="material-icons">view_list</i> ${isVisible ? 'View List' : 'Hide List'}
        `;
    }

    // Event listener for the fetch button
    fetchButton.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default form submission
        batchContainer.style.display = 'none';
        settingsIcon.style.display = 'flex';
        settingsIcon.innerHTML = '<i class="material-icons">view_list</i> View List';
    });

    // Event listener for the settings icon
    settingsIcon.addEventListener('click', toggleBatchContainer);


    var textarea = document.getElementById('dataUrls');
    M.textareaAutoResize(textarea);

    textarea.addEventListener('input', function() {
        if (this.scrollHeight > 500) {
            this.style.height = '500px';
        } else {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        }
    });

});
