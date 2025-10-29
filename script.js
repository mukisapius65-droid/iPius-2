// script.js
// Global variables
let elements = [];
let selectedElement = null;

// DOM elements
const previewArea = document.getElementById('preview-area');
const generatedCode = document.getElementById('generated-code');
const elementContent = document.getElementById('element-content');
const elementBgColor = document.getElementById('element-bg-color');
const elementTextColor = document.getElementById('element-text-color');
const elementPadding = document.getElementById('element-padding');
const paddingValue = document.getElementById('padding-value');
const pageTitle = document.getElementById('page-title');
const pageBgColor = document.getElementById('page-bg-color');
const textColor = document.getElementById('text-color');

// Initialize the editor
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to element buttons
    document.querySelectorAll('.element-btn').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            addElement(type);
        });
    });

    // Add event listeners to control buttons
    document.getElementById('update-element').addEventListener('click', updateSelectedElement);
    document.getElementById('delete-element').addEventListener('click', deleteSelectedElement);
    document.getElementById('generate-code').addEventListener('click', generateHTMLCode);
    document.getElementById('reset-layout').addEventListener('click', resetLayout);
    document.getElementById('copy-code').addEventListener('click', copyCodeToClipboard);

    // Add event listeners to page settings
    pageTitle.addEventListener('input', updatePageSettings);
    pageBgColor.addEventListener('input', updatePageSettings);
    textColor.addEventListener('input', updatePageSettings);
    
    // Update padding value display
    elementPadding.addEventListener('input', function() {
        paddingValue.textContent = this.value + 'px';
    });
    
    // Initialize with a sample header
    addElement('header');
});

// Function to add a new element to the preview
function addElement(type) {
    const id = 'element-' + Date.now();
    let content = '';
    let tag = 'div';
    let defaultStyles = {};
    
    switch(type) {
        case 'header':
            content = 'Welcome to My Website';
            tag = 'h1';
            defaultStyles = {
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center'
            };
            break;
        case 'paragraph':
            content = 'This is a sample paragraph text. You can edit this content in the editor panel to add your own text.';
            tag = 'p';
            defaultStyles = {
                lineHeight: '1.6'
            };
            break;
        case 'button':
            content = 'Click Me';
            tag = 'button';
            defaultStyles = {
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
            };
            break;
        case 'image':
            content = 'https://via.placeholder.com/400x200/3498db/ffffff?text=Sample+Image';
            tag = 'img';
            defaultStyles = {
                maxWidth: '100%',
                display: 'block',
                margin: '0 auto'
            };
            break;
        case 'divider':
            content = '';
            tag = 'hr';
            defaultStyles = {
                height: '2px',
                backgroundColor: '#ddd',
                border: 'none',
                margin: '20px 0'
            };
            break;
        case 'container':
            content = 'Container Content';
            tag = 'div';
            defaultStyles = {
                border: '1px dashed #ccc',
                padding: '20px',
                backgroundColor: '#f9f9f9'
            };
            break;
    }
    
    const element = {
        id: id,
        type: type,
        tag: tag,
        content: content,
        styles: {
            backgroundColor: '#ffffff',
            color: '#333333',
            padding: '10px',
            margin: '10px 0',
            ...defaultStyles
        }
    };
    
    elements.push(element);
    renderPreview();
    selectElement(id);
    
    // Remove empty state if it exists
    const emptyState = previewArea.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
}

// Function to render the preview area
function renderPreview() {
    previewArea.innerHTML = '';
    
    if (elements.length === 0) {
        previewArea.innerHTML = '<div class="empty-state"><p>Click on the element buttons to start building your layout</p></div>';
        return;
    }
    
    elements.forEach(element => {
        const elementDiv = document.createElement('div');
        elementDiv.className = 'preview-element';
        elementDiv.id = element.id;
        
        if (selectedElement === element.id) {
            elementDiv.classList.add('selected');
        }
        
        // Apply styles
        for (const [property, value] of Object.entries(element.styles)) {
            elementDiv.style[property] = value;
        }
        
        // Create content based on element type
        if (element.tag === 'img') {
            elementDiv.innerHTML = `
                <img src="${element.content}" alt="Sample Image" style="max-width: 100%;">
                <div class="element-actions">
                    <button class="element-action edit-btn" title="Edit">✏️</button>
                    <button class="element-action delete-btn" title="Delete">🗑️</button>
                </div>
            `;
        } else if (element.tag === 'hr') {
            elementDiv.innerHTML = `
                <hr style="width: 100%;">
                <div class="element-actions">
                    <button class="element-action edit-btn" title="Edit">✏️</button>
                    <button class="element-action delete-btn" title="Delete">🗑️</button>
                </div>
            `;
        } else if (element.tag === 'button') {
            elementDiv.innerHTML = `
                <button style="
                    background-color: ${element.styles.backgroundColor || '#3498db'}; 
                    color: ${element.styles.color || 'white'}; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 4px; 
                    cursor: pointer;
                    font-size: 16px;">
                    ${element.content}
                </button>
                <div class="element-actions">
                    <button class="element-action edit-btn" title="Edit">✏️</button>
                    <button class="element-action delete-btn" title="Delete">🗑️</button>
                </div>
            `;
        } else {
            elementDiv.innerHTML = `
                <${element.tag}>${element.content}</${element.tag}>
                <div class="element-actions">
                    <button class="element-action edit-btn" title="Edit">✏️</button>
                    <button class="element-action delete-btn" title="Delete">🗑️</button>
                </div>
            `;
        }
        
        // Add event listeners to action buttons
        const editBtn = elementDiv.querySelector('.edit-btn');
        const deleteBtn = elementDiv.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(element.id);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            elements = elements.filter(el => el.id !== element.id);
            renderPreview();
            if (selectedElement === element.id) {
                selectedElement = null;
                clearElementControls();
            }
        });
        
        // Add click event to select element
        elementDiv.addEventListener('click', (e) => {
            if (e.target !== editBtn && e.target !== deleteBtn && !e.target.closest('button')) {
                selectElement(element.id);
            }
        });
        
        previewArea.appendChild(elementDiv);
    });
}

// Function to select an element for editing
function selectElement(id) {
    selectedElement = id;
    const element = elements.find(el => el.id === id);
    
    if (element) {
        // Update element controls with current values
        elementContent.value = element.content;
        elementBgColor.value = rgbToHex(element.styles.backgroundColor);
        elementTextColor.value = rgbToHex(element.styles.color);
        
        // Extract padding value (remove 'px' if present)
        const padding = element.styles.padding;
        const paddingNum = padding.toString().replace('px', '');
        elementPadding.value = paddingNum;
        paddingValue.textContent = paddingNum + 'px';
        
        // Highlight selected element in preview
        document.querySelectorAll('.preview-element').forEach(el => {
            el.classList.remove('selected');
        });
        document.getElementById(id).classList.add('selected');
        
        // Scroll to element if needed
        document.getElementById(id).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Function to update the selected element
function updateSelectedElement() {
    if (!selectedElement) {
        alert('Please select an element to update.');
        return;
    }
    
    const element = elements.find(el => el.id === selectedElement);
    if (element) {
        element.content = elementContent.value;
        element.styles.backgroundColor = elementBgColor.value;
        element.styles.color = elementTextColor.value;
        element.styles.padding = elementPadding.value + 'px';
        
        renderPreview();
        selectElement(selectedElement); // Re-select to maintain highlight
    }
}

// Function to delete the selected element
function deleteSelectedElement() {
    if (!selectedElement) {
        alert('Please select an element to delete.');
        return;
    }
    
    if (confirm('Are you sure you want to delete this element?')) {
        elements = elements.filter(el => el.id !== selectedElement);
        selectedElement = null;
        clearElementControls();
        renderPreview();
    }
}

// Function to clear element controls
function clearElementControls() {
    elementContent.value = '';
    elementBgColor.value = '#ffffff';
    elementTextColor.value = '#333333';
    elementPadding.value = 10;
    paddingValue.textContent = '10px';
}

// Function to update page settings
function updatePageSettings() {
    document.body.style.backgroundColor = pageBgColor.value;
    document.body.style.color = textColor.value;
    document.title = pageTitle.value;
}

// Function to generate HTML code
function generateHTMLCode() {
    if (elements.length === 0) {
        generatedCode.innerHTML = '<p class="code-placeholder">No elements to generate code for. Add some elements first.</p>';
        return;
    }
    
    let htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle.value}</title>
    <style>
        body {
            background-color: ${pageBgColor.value};
            color: ${textColor.value};
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        /* Element styles */
    </style>
</head>
<body>
    <div class="container">\n`;
    
    elements.forEach(element => {
        let styleString = '';
        for (const [property, value] of Object.entries(element.styles)) {
            // Convert camelCase to kebab-case for CSS
            const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
            styleString += `    ${cssProperty}: ${value};\n`;
        }
        
        if (element.tag === 'img') {
            htmlCode += `        <img src="${element.content}" alt="Image" style="${styleString}">\n`;
        } else if (element.tag === 'hr') {
            htmlCode += `        <hr style="${styleString}">\n`;
        } else if (element.tag === 'button') {
            htmlCode += `        <button style="${styleString}">${element.content}</button>\n`;
        } else {
            htmlCode += `        <${element.tag} style="${styleString}">${element.content}</${element.tag}>\n`;
        }
    });
    
    htmlCode += `    </div>
</body>
</html>`;
    
    // Format the code with syntax highlighting
    const formattedCode = htmlCode
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    generatedCode.innerHTML = `<pre>${formattedCode}</pre>`;
}

// Function to copy code to clipboard
function copyCodeToClipboard() {
    const codeElement = generatedCode.querySelector('pre');
    if (!codeElement) {
        alert('No code to copy. Generate HTML code first.');
        return;
    }
    
    // Create a temporary textarea to copy from
    const textarea = document.createElement('textarea');
    textarea.value = codeElement.textContent;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // Show feedback
    const copyButton = document.getElementById('copy-code');
    const originalText = copyButton.innerHTML;
    copyButton.innerHTML = '✓ Copied!';
    copyButton.style.backgroundColor = '#2ecc71';
    
    setTimeout(() => {
        copyButton.innerHTML = originalText;
        copyButton.style.backgroundColor = '';
    }, 2000);
}

// Function to reset the layout
function resetLayout() {
    if (elements.length === 0) {
        return;
    }
    
    if (confirm('Are you sure you want to reset the layout? This will remove all elements.')) {
        elements = [];
        selectedElement = null;
        clearElementControls();
        renderPreview();
        generatedCode.innerHTML = '<p class="code-placeholder">Your generated HTML code will appear here after clicking "Generate HTML Code"</p>';
    }
}

// Helper function to convert RGB to Hex
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    
    // Extract RGB values
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) return '#ffffff';
    
    const r = parseInt(rgbValues[0]);
    const g = parseInt(rgbValues[1]);
    const b = parseInt(rgbValues[2]);
    
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
