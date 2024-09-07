I am writing a webapp. I'd like you to give me some CSS and HTML (produced by Javascript) that will attach to the "app" div, and give a UI with a title section, with a user icon on the right with a drop-down menu with the "Log Out" option (settings will come later). Under that, there should be a tab-bar, based on the `sheets` property in a data structure. On each tab, will be a number of sections, based on `sections` inside the `sheet` object. Each section has a title piece, and expandable main section, and a a pencil indicator to go into editing mode for that section. There will be different types of section, but for now we will introduce only one - the "text" type, which will contain paragraphs of text.

Here is the CSS for the menu page before this page, to keep consistency:

.hidden {
    display: none;
}

.gameslist {
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f2f2f2;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0 0 0 0.1);
}

.allgames {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
}

.joingame,
.newgame {
    width: 48%;
    background-color: #fff;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0 0 0 0.1);
}

h1 {
    font-size: 24px;
    margin-bottom: 10px;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

li:last-child {
    border-bottom: none;
}

form {
    display: flex;
    flex-direction: column;
}

label {
    font-weight: bold;
    margin-bottom: 5px;
}

input,
textarea {
    padding: 5px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
}

button {
    padding: 10px;
    background-color: #4CAF50;
    color: #fff;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

button:hover {
    background-color: #45a049;
}

.error-container {
    background-color: #ffebee;
    border: 1px solid #f44336;
    border-radius: 3px;
    padding: 10px;
    margin-top: 10px;
}

.error-container.hidden {
    display: none;
}

.error-message {
    color: #f44336;
    margin-bottom: 10px;
}

.error-container button {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    cursor: pointer;
}

.error-container button:hover {
    background-color: #d32f2f;
}

.game-link {
    text-decoration: none;
    color: inherit;
    display: block;
    width: 100%;
    height: 100%;
    padding: 10px;
    transition: background-color 0.2s ease;
}

.game-link:hover {
    background-color: #f0f0f0;
}






Here's a CSS and HTML structure (produced by JavaScript) that meets your requirements. This will create a UI with a title section, user icon with a dropdown menu, tab bar, and sections with expandable content and edit functionality.

First, let's add some CSS:

```css
.app {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f2f2f2;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.title {
    font-size: 24px;
    font-weight: bold;
}

.user-menu {
    position: relative;
}

.user-icon {
    cursor: pointer;
    font-size: 24px;
}

.dropdown-menu {
    position: absolute;
    right: 0;
    top: 100%;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 3px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: none;
}

.dropdown-menu.show {
    display: block;
}

.dropdown-menu ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.dropdown-menu li {
    padding: 10px;
    cursor: pointer;
}

.dropdown-menu li:hover {
    background-color: #f0f0f0;
}

.tab-bar {
    display: flex;
    border-bottom: 1px solid #ddd;
    margin-bottom: 20px;
}

.tab {
    padding: 10px 20px;
    cursor: pointer;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 3px 3px 0 0;
}

.tab.active {
    background-color: #fff;
    border-color: #ddd;
}

.section {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 3px;
    margin-bottom: 20px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #ddd;
}

.section-title {
    font-weight: bold;
}

.section-controls {
    display: flex;
    gap: 10px;
}

.expand-btn, .edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
}

.section-content {
    padding: 10px;
    display: none;
}

.section-content.expanded {
    display: block;
}
```

Now, let's create a JavaScript function to generate the HTML structure:

```javascript
function generateAppHTML(data) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="header">
            <h1 class="title">${data.title}</h1>
            <div class="user-menu">
                <div class="user-icon">👤</div>
                <div class="dropdown-menu">
                    <ul>
                        <li>Log Out</li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="tab-bar">
            ${data.sheets.map((sheet, index) => `
                <div class="tab ${index === 0 ? 'active' : ''}" data-sheet="${index}">
                    ${sheet.name}
                </div>
            `).join('')}
        </div>
        ${data.sheets.map((sheet, sheetIndex) => `
            <div class="sheet" data-sheet="${sheetIndex}" ${sheetIndex === 0 ? '' : 'style="display: none;"'}>
                ${sheet.sections.map((section, sectionIndex) => `
                    <div class="section">
                        <div class="section-header">
                            <span class="section-title">${section.title}</span>
                            <div class="section-controls">
                                <button class="expand-btn">🔽</button>
                                <button class="edit-btn">✏️</button>
                            </div>
                        </div>
                        <div class="section-content">
                            ${section.type === 'text' ? `
                                ${section.content.map(paragraph => `
                                    <p>${paragraph}</p>
                                `).join('')}
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    `;

    // Add event listeners
    const userIcon = app.querySelector('.user-icon');
    const dropdownMenu = app.querySelector('.dropdown-menu');
    userIcon.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    const tabs = app.querySelectorAll('.tab');
    const sheets = app.querySelectorAll('.sheet');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const sheetIndex = tab.dataset.sheet;
            sheets.forEach(sheet => {
                sheet.style.display = sheet.dataset.sheet === sheetIndex ? 'block' : 'none';
            });
        });
    });

    const expandBtns = app.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.closest('.section').querySelector('.section-content');
            content.classList.toggle('expanded');
            btn.textContent = content.classList.contains('expanded') ? '🔼' : '🔽';
        });
    });
}
```

To use this, you would call the `generateAppHTML` function with your data structure:

```javascript
const appData = {
    title: "My App",
    sheets: [
        {
            name: "Sheet 1",
            sections: [
                {
                    title: "Section 1",
                    type: "text",
                    content: ["This is paragraph 1", "This is paragraph 2"]
                },
                {
                    title: "Section 2",
                    type: "text",
                    content: ["This is another paragraph"]
                }
            ]
        },
        {
            name: "Sheet 2",
            sections: [
                {
                    title: "Section 3",
                    type: "text",
                    content: ["Content for Sheet 2"]
                }
            ]
        }
    ]
};

generateAppHTML(appData);
```

This will create a UI with a title, user icon with dropdown, tab bar for sheets, and sections with expandable content. The edit functionality (pencil icon) is included in the UI, but doesn't have any behavior attached to it yet. You can add that functionality as needed.








I'd like the user icon to be the standard gravatar in a circle thing




Certainly! Assuming you'll import an MD5 library, let's continue with the rest of the implementation. Here's what we need to do:

1. Update the data structure to include the user's email.
2. Modify the `generateAppHTML` function to use the Gravatar image.
3. Add some additional styling for better appearance.

Here's the updated JavaScript:

```javascript
function generateAppHTML(data) {
    const app = document.getElementById('app');
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(data.userEmail)}?d=identicon&s=200`;

    app.innerHTML = `
        <div class="header">
            <h1 class="title">${data.title}</h1>
            <div class="user-menu">
                <div class="user-icon">
                    <img src="${gravatarUrl}" alt="User Avatar">
                </div>
                <div class="dropdown-menu">
                    <ul>
                        <li>Log Out</li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="tab-bar">
            ${data.sheets.map((sheet, index) => `
                <div class="tab ${index === 0 ? 'active' : ''}" data-sheet="${index}">
                    ${sheet.name}
                </div>
            `).join('')}
        </div>
        ${data.sheets.map((sheet, sheetIndex) => `
            <div class="sheet" data-sheet="${sheetIndex}" ${sheetIndex === 0 ? '' : 'style="display: none;"'}>
                ${sheet.sections.map((section, sectionIndex) => `
                    <div class="section">
                        <div class="section-header">
                            <span class="section-title">${section.title}</span>
                            <div class="section-controls">
                                <button class="expand-btn">🔽</button>
                                <button class="edit-btn">✏️</button>
                            </div>
                        </div>
                        <div class="section-content">
                            ${section.type === 'text' ? `
                                ${section.content.map(paragraph => `
                                    <p>${paragraph}</p>
                                `).join('')}
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    `;

    // Add event listeners
    const userIcon = app.querySelector('.user-icon');
    const dropdownMenu = app.querySelector('.dropdown-menu');
    userIcon.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    const tabs = app.querySelectorAll('.tab');
    const sheets = app.querySelectorAll('.sheet');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const sheetIndex = tab.dataset.sheet;
            sheets.forEach(sheet => {
                sheet.style.display = sheet.dataset.sheet === sheetIndex ? 'block' : 'none';
            });
        });
    });

    const expandBtns = app.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.closest('.section').querySelector('.section-content');
            content.classList.toggle('expanded');
            btn.textContent = content.classList.contains('expanded') ? '🔼' : '🔽';
        });
    });
}
```

Now, let's add some additional CSS to improve the appearance:

```css
.app {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f2f2f2;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.title {
    font-size: 24px;
    font-weight: bold;
}

.user-menu {
    position: relative;
}

.user-icon {
    cursor: pointer;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.user-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.dropdown-menu {
    position: absolute;
    right: 0;
    top: 100%;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 3px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    display: none;
    z-index: 1000;
}

.dropdown-menu.show {
    display: block;
}

.dropdown-menu ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.dropdown-menu li {
    padding: 10px 20px;
    cursor: pointer;
}

.dropdown-menu li:hover {
    background-color: #f0f0f0;
}

.tab-bar {
    display: flex;
    border-bottom: 1px solid #ddd;
    margin-bottom: 20px;
}

.tab {
    padding: 10px 20px;
    cursor: pointer;
    border: 1px solid transparent;
    border-bottom: none;
    border-radius: 3px 3px 0 0;
    transition: background-color 0.3s ease;
}

.tab:hover {
    background-color: #e0e0e0;
}

.tab.active {
    background-color: #fff;
    border-color: #ddd;
}

.section {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 3px;
    margin-bottom: 20px;
    overflow: hidden;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #f0f0f0;
    border-bottom: 1px solid #ddd;
}

.section-title {
    font-weight: bold;
}

.section-controls {
    display: flex;
    gap: 10px;
}

.expand-btn, .edit-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    padding: 5px;
    border-radius: 3px;
    transition: background-color 0.3s ease;
}

.expand-btn:hover, .edit-btn:hover {
    background-color: #ddd;
}

.section-content {
    padding: 0 15px;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
}

.section-content.expanded {
    padding: 15px;
    max-height: 1000px; /* Adjust this value as needed */
}
```

To use this updated version, you would call the `generateAppHTML` function with your data structure, including the user's email:

```javascript
const appData = {
    title: "My App",
    userEmail: "user@example.com",
    sheets: [
        {
            name: "Sheet 1",
            sections: [
                {
                    title: "Section 1",
                    type: "text",
                    content: ["This is paragraph 1", "This is paragraph 2"]
                },
                {
                    title: "Section 2",
                    type: "text",
                    content: ["This is another paragraph"]
                }
            ]
        },
        {
            name: "Sheet 2",
            sections: [
                {
                    title: "Section 3",
                    type: "text",
                    content: ["Content for Sheet 2"]
                }
            ]
        }
    ]
};

generateAppHTML(appData);
```

This will create a UI with a title, circular Gravatar user icon with dropdown, tab bar for sheets, and sections with expandable content. The edit functionality (pencil icon) is included in the UI, but doesn't have any behavior attached to it yet. You can add that functionality as needed.










Can you include the logic for the "text" type sections to become editable? After editing, they should call a function editSection, with the new content, sheet ID, and section ID. You'll need to amend what you have to include the IDs

Certainly! I'll modify the code to include the logic for making "text" type sections editable and add the necessary IDs. Here's the updated JavaScript function:

```javascript
function generateAppHTML(data) {
    const app = document.getElementById('app');
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(data.userEmail)}?d=identicon&s=200`;

    app.innerHTML = `
        <div class="header">
            <h1 class="title">${data.title}</h1>
            <div class="user-menu">
                <div class="user-icon">
                    <img src="${gravatarUrl}" alt="User Avatar">
                </div>
                <div class="dropdown-menu">
                    <ul>
                        <li>Log Out</li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="tab-bar">
            ${data.sheets.map((sheet, index) => `
                <div class="tab ${index === 0 ? 'active' : ''}" data-sheet="${index}">
                    ${sheet.name}
                </div>
            `).join('')}
        </div>
        ${data.sheets.map((sheet, sheetIndex) => `
            <div class="sheet" data-sheet="${sheetIndex}" ${sheetIndex === 0 ? '' : 'style="display: none;"'}>
                ${sheet.sections.map((section, sectionIndex) => `
                    <div class="section" data-sheet-id="${sheetIndex}" data-section-id="${sectionIndex}">
                        <div class="section-header">
                            <span class="section-title">${section.title}</span>
                            <div class="section-controls">
                                <button class="expand-btn">🔽</button>
                                <button class="edit-btn">✏️</button>
                            </div>
                        </div>
                        <div class="section-content">
                            ${section.type === 'text' ? `
                                <div class="text-content">
                                    ${section.content.map(paragraph => `
                                        <p>${paragraph}</p>
                                    `).join('')}
                                </div>
                                <textarea class="edit-textarea" style="display: none;">${section.content.join('\n\n')}</textarea>
                                <div class="edit-controls" style="display: none;">
                                    <button class="save-btn">Save</button>
                                    <button class="cancel-btn">Cancel</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    `;

    // Add event listeners
    const userIcon = app.querySelector('.user-icon');
    const dropdownMenu = app.querySelector('.dropdown-menu');
    userIcon.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    const tabs = app.querySelectorAll('.tab');
    const sheets = app.querySelectorAll('.sheet');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const sheetIndex = tab.dataset.sheet;
            sheets.forEach(sheet => {
                sheet.style.display = sheet.dataset.sheet === sheetIndex ? 'block' : 'none';
            });
        });
    });

    const expandBtns = app.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.closest('.section').querySelector('.section-content');
            content.classList.toggle('expanded');
            btn.textContent = content.classList.contains('expanded') ? '🔼' : '🔽';
        });
    });

    const editBtns = app.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.section');
            const textContent = section.querySelector('.text-content');
            const textarea = section.querySelector('.edit-textarea');
            const editControls = section.querySelector('.edit-controls');

            textContent.style.display = 'none';
            textarea.style.display = 'block';
            editControls.style.display = 'block';
            textarea.focus();
        });
    });

    const saveBtns = app.querySelectorAll('.save-btn');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.section');
            const sheetId = section.dataset.sheetId;
            const sectionId = section.dataset.sectionId;
            const textarea = section.querySelector('.edit-textarea');
            const newContent = textarea.value.split('\n\n').filter(para => para.trim() !== '');

            editSection(newContent, sheetId, sectionId);

            const textContent = section.querySelector('.text-content');
            textContent.innerHTML = newContent.map(para => `<p>${para}</p>`).join('');

            textContent.style.display = 'block';
            textarea.style.display = 'none';
            btn.parentElement.style.display = 'none';
        });
    });

    const cancelBtns = app.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.section');
            const textContent = section.querySelector('.text-content');
            const textarea = section.querySelector('.edit-textarea');

            textContent.style.display = 'block';
            textarea.style.display = 'none';
            btn.parentElement.style.display = 'none';
        });
    });
}

function editSection(newContent, sheetId, sectionId) {
    // This function should be implemented to handle the editing of a section
    console.log('Editing section:', { newContent, sheetId, sectionId });
    // Here you would typically send the new content to your backend or update your data structure
}
```

I've made the following changes:

1. Added `data-sheet-id` and `data-section-id` attributes to each section div.
2. Included a textarea and edit controls (Save and Cancel buttons) for each text section.
3. Added event listeners for the edit, save, and cancel buttons.
4. Implemented the logic to switch between viewing and editing modes.
5. Created an `editSection` function stub that you can implement to handle the actual data updates.

You'll need to add some CSS to style the new elements:

```css
.edit-textarea {
    width: 100%;
    min-height: 100px;
    margin-bottom: 10px;
    padding: 5px;
    border: 1px solid #ddd;
    border-radius: 3px;
}

.edit-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.save-btn, .cancel-btn {
    padding: 5px 10px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

.save-btn {
    background-color: #4CAF50;
    color: white;
}

.cancel-btn {
    background-color: #f44336;
    color: white;
}

.save-btn:hover, .cancel-btn:hover {
    opacity: 0.8;
}
```

Now, when you click the edit button, the text content will be replaced with a textarea for editing. Clicking "Save" will update the content and call the `editSection` function with the new content, sheet ID, and section ID. Clicking "Cancel" will revert the changes and return to the view mode.

Remember to implement the `editSection` function according to your specific needs, such as updating your data structure or sending the changes to a backend server.







.innerHTML is bad practice


You're absolutely right, and I apologize for using .innerHTML in the previous example. It's indeed considered bad practice due to potential security risks (like XSS vulnerabilities) and performance issues. Let's refactor the code to use DOM manipulation methods instead. Here's an updated version of the `generateAppHTML` function that avoids using .innerHTML:

```javascript
function generateAppHTML(data) {
    const app = document.getElementById('app');
    app.textContent = ''; // Clear existing content

    const header = createHeader(data.title, data.userEmail);
    const tabBar = createTabBar(data.sheets);
    const sheets = createSheets(data.sheets);

    app.appendChild(header);
    app.appendChild(tabBar);
    sheets.forEach(sheet => app.appendChild(sheet));

    addEventListeners(app);
}

function createHeader(title, userEmail) {
    const header = document.createElement('div');
    header.className = 'header';

    const titleElement = document.createElement('h1');
    titleElement.className = 'title';
    titleElement.textContent = title;

    const userMenu = createUserMenu(userEmail);

    header.appendChild(titleElement);
    header.appendChild(userMenu);

    return header;
}

function createUserMenu(userEmail) {
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';

    const userIcon = document.createElement('div');
    userIcon.className = 'user-icon';

    const img = document.createElement('img');
    img.src = `https://www.gravatar.com/avatar/${md5(userEmail)}?d=identicon&s=200`;
    img.alt = 'User Avatar';

    userIcon.appendChild(img);

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';

    const ul = document.createElement('ul');
    const li = document.createElement('li');
    li.textContent = 'Log Out';
    ul.appendChild(li);

    dropdownMenu.appendChild(ul);

    userMenu.appendChild(userIcon);
    userMenu.appendChild(dropdownMenu);

    return userMenu;
}

function createTabBar(sheets) {
    const tabBar = document.createElement('div');
    tabBar.className = 'tab-bar';

    sheets.forEach((sheet, index) => {
        const tab = document.createElement('div');
        tab.className = `tab ${index === 0 ? 'active' : ''}`;
        tab.dataset.sheet = index;
        tab.textContent = sheet.name;
        tabBar.appendChild(tab);
    });

    return tabBar;
}

function createSheets(sheets) {
    return sheets.map((sheet, sheetIndex) => {
        const sheetElement = document.createElement('div');
        sheetElement.className = 'sheet';
        sheetElement.dataset.sheet = sheetIndex;
        if (sheetIndex !== 0) {
            sheetElement.style.display = 'none';
        }

        sheet.sections.forEach((section, sectionIndex) => {
            const sectionElement = createSection(section, sheetIndex, sectionIndex);
            sheetElement.appendChild(sectionElement);
        });

        return sheetElement;
    });
}

function createSection(section, sheetIndex, sectionIndex) {
    const sectionElement = document.createElement('div');
    sectionElement.className = 'section';
    sectionElement.dataset.sheetId = sheetIndex;
    sectionElement.dataset.sectionId = sectionIndex;

    const header = createSectionHeader(section.title);
    const content = createSectionContent(section);

    sectionElement.appendChild(header);
    sectionElement.appendChild(content);

    return sectionElement;
}

function createSectionHeader(title) {
    const header = document.createElement('div');
    header.className = 'section-header';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'section-title';
    titleSpan.textContent = title;

    const controls = document.createElement('div');
    controls.className = 'section-controls';

    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-btn';
    expandBtn.textContent = '🔽';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';

    controls.appendChild(expandBtn);
    controls.appendChild(editBtn);

    header.appendChild(titleSpan);
    header.appendChild(controls);

    return header;
}

function createSectionContent(section) {
    const content = document.createElement('div');
    content.className = 'section-content';

    if (section.type === 'text') {
        const textContent = document.createElement('div');
        textContent.className = 'text-content';

        section.content.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            textContent.appendChild(p);
        });

        const textarea = document.createElement('textarea');
        textarea.className = 'edit-textarea';
        textarea.style.display = 'none';
        textarea.value = section.content.join('\n\n');

        const editControls = document.createElement('div');
        editControls.className = 'edit-controls';
        editControls.style.display = 'none';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = 'Save';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancel';

        editControls.appendChild(saveBtn);
        editControls.appendChild(cancelBtn);

        content.appendChild(textContent);
        content.appendChild(textarea);
        content.appendChild(editControls);
    }

    return content;
}

function addEventListeners(app) {
    // User menu dropdown
    const userIcon = app.querySelector('.user-icon');
    const dropdownMenu = app.querySelector('.dropdown-menu');
    userIcon.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    });

    // Tab switching
    const tabs = app.querySelectorAll('.tab');
    const sheets = app.querySelectorAll('.sheet');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const sheetIndex = tab.dataset.sheet;
            sheets.forEach(sheet => {
                sheet.style.display = sheet.dataset.sheet === sheetIndex ? 'block' : 'none';
            });
        });
    });

    // Expand/collapse sections
    const expandBtns = app.querySelectorAll('.expand-btn');
    expandBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.closest('.section').querySelector('.section-content');
            content.classList.toggle('expanded');
            btn.textContent = content.classList.contains('expanded') ? '🔼' : '🔽';
        });
    });

    // Edit sections
    const editBtns = app.querySelectorAll('.edit-btn');
    editBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.section');
            const textContent = section.querySelector('.text-content');
            const textarea = section.querySelector('.edit-textarea');
            const editControls = section.querySelector('.edit-controls');

            textContent.style.display = 'none';
            textarea.style.display = 'block';
            editControls.style.display = 'block';
            textarea.focus();
        });
    });

    // Save edits
    const saveBtns = app.querySelectorAll('.save-btn');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.section');
            const sheetId = section.dataset.sheetId;
            const sectionId = section.dataset.sectionId;
            const textarea = section.querySelector('.edit-textarea');
            const newContent = textarea.value.split('\n\n').filter(para => para.trim() !== '');

            editSection(newContent, sheetId, sectionId);

            const textContent = section.querySelector('.text-content');
            textContent.innerHTML = '';
            newContent.forEach(para => {
                const p = document.createElement('p');
                p.textContent = para;
                textContent.appendChild(p);
            });

            textContent.style.display = 'block';
            textarea.style.display = 'none';
            btn.parentElement.style.display = 'none';
        });
    });

    // Cancel edits
    const cancelBtns = app.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.closest('.section');
            const textContent = section.querySelector('.text-content');
            const textarea = section.querySelector('.edit-textarea');

            textContent.style.display = 'block';
            textarea.style.display = 'none';
            btn.parentElement.style.display = 'none';
        });
    });
}

function editSection(newContent, sheetId, sectionId) {
    // This function should be implemented to handle the editing of a section
    console.log('Editing section:', { newContent, sheetId, sectionId });
    // Here you would typically send the new content to your backend or update your data structure
}
```

This refactored version creates all elements using DOM manipulation methods like `createElement`, `appendChild`, and `textContent`. It's more secure and follows better practices. The functionality remains the same as in the previous version.

You can use this function the same way as before:

```javascript
const appData = {
    title: "My App",
    userEmail: "user@example.com",
    sheets: [
        {
            name: "Sheet 1",
            sections: [
                {
                    title: "Section 1",
                    type: "text",
                    content: ["This is paragraph 1", "This is paragraph 2"]
                },
                {
                    title: "Section 2",
                    type: "text",
                    content: ["This is another paragraph"]
                }
            ]
        },
        {
            name: "Sheet 2",
            sections: [
                {
                    title: "Section 3",
                    type: "text",
                    content: ["Content for Sheet 2"]
                }
            ]
        }
    ]
};

generateAppHTML(appData);
```

This approach is safer and more maintainable, avoiding the security risks associated with `innerHTML`.
