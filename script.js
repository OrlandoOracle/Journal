const CLIENT_ID = '741568016177-0htm6oj2tv6289tdhmlb0eqki7rbm7cb.apps.googleusercontent.com';
const API_KEY = 'AIzaSyApjmrRNgU7rRWhsy7NK9tE_tbN5wOShtM';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let documentsData = {
    'journals-docs': [],
    'personal-docs': [],
    'project-docs': []
};

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, function(error) {
        console.error('Error initializing GAPI client', error);
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        listFiles();
    } else {
        gapi.auth2.getAuthInstance().signIn();
    }
}

function listFiles() {
    gapi.client.drive.files.list({
        'pageSize': 1000,
        'fields': "nextPageToken, files(id, name, mimeType)"
    }).then(function(response) {
        const files = response.result.files;
        categorizeFiles(files);
        updateDocumentLists();
    });
}

function categorizeFiles(files) {
    documentsData = {
        'journals-docs': [],
        'personal-docs': [],
        'project-docs': []
    };
    
    files.forEach(file => {
        if (file.name.toLowerCase().includes('journal')) {
            documentsData['journals-docs'].push(file);
        } else if (file.name.toLowerCase().includes('project')) {
            documentsData['project-docs'].push(file);
        } else {
            documentsData['personal-docs'].push(file);
        }
    });
}

function updateDocumentLists() {
    for (let category in documentsData) {
        const list = document.getElementById(category);
        documentsData[category].forEach(doc => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = doc.name;
            a.href = '#';
            a.onclick = function() { openDocument(doc.id); return false; };
            li.appendChild(a);
            list.insertBefore(li, list.lastElementChild);
        });
    }
}

function createNewDoc(category) {
    const date = new Date().toISOString().split('T')[0];
    const docName = `${category} - ${date}`;
    gapi.client.drive.files.create({
        resource: {
            name: docName,
            mimeType: 'application/vnd.google-apps.document'
        }
    }).then(function(response) {
        const file = response.result;
        const list = document.getElementById(`${category.toLowerCase()}-docs`);
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = file.name;
        a.href = '#';
        a.onclick = function() { openDocument(file.id); return false; };
        li.appendChild(a);
        list.insertBefore(li, list.lastElementChild);
        openDocument(file.id);
    });
}

function openDocument(fileId) {
    const modal = document.getElementById('documentModal');
    const iframe = document.getElementById('documentFrame');
    iframe.src = `https://docs.google.com/document/d/${fileId}/edit`;
    modal.style.display = 'block';
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

document.getElementById('darkModeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
});

document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('documentModal').style.display = 'none';
});

window.onclick = function(event) {
    const modal = document.getElementById('documentModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

handleClientLoad();