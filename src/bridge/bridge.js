function setCookie(name, value, days) {
	var expires = '';
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = '; expires=' + date.toUTCString();
	}
	document.cookie = name + '=' + (value || '') + expires + '; path=/';
}
function getCookie(name) {
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}
function eraseCookie(name) {
	document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

const openedProjKey = 'opened_proj';

function updateCurrentlySelectedProject(projectId) {
	setCookie(openedProjKey, projectId, 7);
}

function getCurrentlySelectedProject() {
	return getCookie(openedProjKey);
}

async function request(method, path, content, isParams) {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		let cntStr = 'http://localhost:8080/' + path;

		if (isParams) {
			for (const [k, v] of Object.entries(content)) {
				cntStr += (Object.keys(content)[0] === k ? '?' : '&') + k + '=' + v;
			}
		}

		xhr.open(method, cntStr);
		xhr.withCredentials = true;

		if (!isParams) xhr.setRequestHeader('Content-Type', 'application/json');

		xhr.send(!isParams ? JSON.stringify(content) : null);

		xhr.onreadystatechange = (event) => {
			if (xhr.readyState != 4) return;

			if (xhr.status == 200) resolve(xhr.response);
			else resolve(xhr.status);
		};
	});
}

function loginAccount(email, password) {
	return (
		request('POST', 'login', { email: email, password: password }, true) == 200
	);
}

function createAccount(name, email, pass) {
	return (
		request(
			'POST',
			'register',
			{ name: name, email: email, password: pass },
			false
		) == 200
	);
}

function getCurrentUserId() {
	return request('GET', 'me', {}, true);
}

class Project {
	constructor(func, content, isParams) {
		this.func = func;
		this.apiPath = 'api/project/' + func;
		this.content = content;
		this.isParams = isParams;
	}

	send() {
		let method = '';
		switch (this.func) {
			case 'grab':
				method = 'GET';
				break;
			case 'create':
				method = 'POST';
				break;
			case 'delete':
				method = 'DELETE';
				break;
			case 'projectsOf':
				method = 'GET';
				break;
			default:
				method = '';
				break;
		}

		return request(method, this.apiPath, this.content, this.isParams);
	}
}

function createProject(creatorId, name) {
	return new Project(
		'create',
		{ creatorId: creatorId, name: name },
		true
	).send();
}

function getProject(id) {
	return new Project('grab', { id: id }, true).send();
}

function projectsOf(userId) {
	return new Project('projectsOf', { userId: userId }, true).send();
}

function deleteProject(id) {
	if (id == getCurrentlySelectedProject()) {
		eraseCookie(openedProjKey);
	}
	return new Project('delete', { id: id }, true).send();
}

class ProjectPanel {
	constructor(func, isDel, content, isParams) {
		this.func = func;
		this.apiPath = 'api/project_panel/' + func;
		this.content = content;
		this.isParams = isParams;
	}

	send() {
		let method = '';
		switch (this.func) {
			case 'name':
				method = 'POST';
				break;
			case 'budget':
				method = 'POST';
				break;
			case 'roles':
				method = 'POST';
				break;
			case 'crew_members':
				method = isDel ? 'DELETE' : 'POST';
				break;
			case 'tasks':
				method = 'POST';
				break;
			case 'data':
				method = 'GET';
				break;
			default:
				method = '';
				break;
		}

		return request(method, this.apiPath, this.content, this.isParams);
	}
}

function getData(projectID) {
	return new ProjectPanel('data', false, { projectID: projectID }, true).send();
}

function renameProject(projectID, new_name) {
	return new ProjectPanel(
		'name',
		false,
		{ projectID: projectID, new_name: new_name },
		true
	).send();
}

function setBudget(projectID, budget_currency, new_budget) {
	return new ProjectPanel(
		'budget',
		false,
		{
			projectID: projectID,
			budget_currency: budget_currency,
			new_budget: new_budget,
		},
		true
	).send();
}

function updateRoles(projectID, roles) {
	return new ProjectPanel(
		'roles',
		false,
		{ projectID: projectID, roles: roles },
		true
	).send();
}

function setCrewMember(projectID, member_id, role) {
	return new ProjectPanel(
		'crew_members',
		false,
		{ projectID: projectID, member_id: member_id, role: role },
		true
	).send();
}

function removeCrewMember(projectID, member_id) {
	return new ProjectPanel(
		'crew_members',
		true,
		{ projectID: projectID, member_id: member_id },
		true
	).send();
}

function updateTasks(projectID, tasks) {
	return new ProjectPanel(
		'tasks',
		false,
		{ projectID: projectID, tasks: tasks },
		true
	).send();
}

const userinitialized = new CustomEvent('userinitialized', {
	detail: {},
	bubbles: false,
	cancelable: false,
	composed: false,
});

let currentUserId = null;
getCurrentUserId().then((result) => {
	currentUserId = result;
	document.dispatchEvent(userinitialized);
});
