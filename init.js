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