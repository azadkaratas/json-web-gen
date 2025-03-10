// script.js
import { Api } from './api.js';

fetch('config.json')
  .then(response => {
    if (!response.ok) throw new Error('Config file could not be loaded');
    return response.json();
  })
  .then(data => {
    document.title = data.title || 'Device Configuration';

    const accordionContainer = document.getElementById('accordion');
    const contentContainer = document.getElementById('content');

    // Customize header
    const headerProjectName = document.querySelector('header .col-6.col-md-8 h1');
    const headerLogo = document.querySelector('header .col-3.col-md-2 img');
    const sidebarHeaderLogo = document.querySelector('.sidebar-header img');
    const sidebarHeaderTitle = document.querySelector('.sidebar-header h2');

    if (data.header) {
      headerProjectName.textContent = data.header.projectName || 'Project Name';
      if (data.header.logo) {
        headerLogo.src = data.header.logo;
        sidebarHeaderLogo.src = data.header.logo;
      }
      sidebarHeaderTitle.textContent = data.header.projectName || 'Project Name';
    }

    // Generate tabs
    data.tabs.forEach((tab, index) => {
      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item';

      const accordionHeader = document.createElement('h2');
      accordionHeader.className = 'accordion-header';
      accordionHeader.id = `heading-${index}`;

      const accordionButton = document.createElement('button');
      accordionButton.className = 'accordion-button collapsed';
      accordionButton.type = 'button';
      accordionButton.textContent = tab.title;
      accordionButton.dataset.tabId = tab.id || `tab-${index}`;

      if (!tab.subtabs || tab.subtabs.length === 0) {
        accordionButton.onclick = (e) => {
          e.preventDefault();
          document.querySelectorAll('.accordion-collapse.show').forEach(collapse => {
            const bsCollapse = new bootstrap.Collapse(collapse, { toggle: false });
            bsCollapse.hide();
          });
          showContent(tab, data.content, tab.title);
        };
      } else {
        accordionButton.setAttribute('data-bs-toggle', 'collapse');
        accordionButton.setAttribute('data-bs-target', `#collapse-${index}`);
        accordionButton.setAttribute('aria-expanded', 'false');
        accordionButton.setAttribute('aria-controls', `collapse-${index}`);

        accordionButton.addEventListener('click', (e) => {
          const collapseElement = document.getElementById(`collapse-${index}`);
          const isOpen = collapseElement.classList.contains('show');
          if (isOpen) {
            e.preventDefault();
            const bsCollapse = new bootstrap.Collapse(collapseElement, { toggle: false });
            bsCollapse.hide();
          }
        });
      }

      accordionHeader.appendChild(accordionButton);
      accordionItem.appendChild(accordionHeader);

      if (tab.subtabs && tab.subtabs.length > 0) {
        const accordionBody = document.createElement('div');
        accordionBody.id = `collapse-${index}`;
        accordionBody.className = 'accordion-collapse collapse';
        accordionBody.setAttribute('aria-labelledby', `heading-${index}`);
        accordionBody.setAttribute('data-bs-parent', '#accordion');

        const accordionBodyContent = document.createElement('div');
        accordionBodyContent.className = 'accordion-body';

        tab.subtabs.forEach(subtab => {
          const subtabLink = document.createElement('a');
          subtabLink.href = `#${subtab.id}`;
          subtabLink.className = 'list-group-item list-group-item-action';
          subtabLink.textContent = subtab.title;
          subtabLink.dataset.subtabId = subtab.id;
          subtabLink.onclick = (e) => {
            e.preventDefault();
            const collapseElement = document.getElementById(`collapse-${index}`);
            if (!collapseElement.classList.contains('show')) {
              const bsCollapse = new bootstrap.Collapse(collapseElement, { toggle: false });
              bsCollapse.show();
            }
            showContent(subtab, data.content, tab.title);
          };
          accordionBodyContent.appendChild(subtabLink);
        });

        accordionBody.appendChild(accordionBodyContent);
        accordionItem.appendChild(accordionBody);
      }

      accordionContainer.appendChild(accordionItem);
    });

    if (data.tabs.length > 0) {
      const firstTab = data.tabs[0];
      if (firstTab.subtabs && firstTab.subtabs.length > 0) {
        const firstSubtab = firstTab.subtabs[0];
        showContent(firstSubtab, data.content, firstTab.title);
        const collapseElement = document.querySelector('.accordion-collapse');
        if (collapseElement) {
          const bsCollapse = new bootstrap.Collapse(collapseElement, { toggle: false });
          bsCollapse.show();
        }
      } else {
        showContent(firstTab, data.content, firstTab.title);
      }
    }

    async function showContent(item, contentData, tabTitle) {
      const overlay = document.getElementById('sidebarOverlay');
      const sidebar = document.getElementById('sidebar');
      if (window.innerWidth < 768 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      }

      contentContainer.innerHTML = '';

      document.querySelectorAll('.accordion-button.active-tab').forEach(el => el.classList.remove('active-tab'));
      document.querySelectorAll('.list-group-item.active-subtab').forEach(el => el.classList.remove('active-subtab'));

      if (!item.subtabs) {
        const subtabLink = document.querySelector(`.list-group-item[data-subtab-id="${item.id}"]`);
        if (subtabLink) {
          subtabLink.classList.add('active-subtab');
          const parentTab = data.tabs.find(tab => tab.subtabs && tab.subtabs.some(sub => sub.id === item.id));
          if (parentTab) {
            const parentTabButton = document.querySelector(`.accordion-button[data-tab-id="${parentTab.id || `tab-${data.tabs.findIndex(t => t.title === parentTab.title)}`}"]`);
            if (parentTabButton) parentTabButton.classList.add('active-tab');
          }
        }
      } else {
        const tabButton = document.querySelector(`.accordion-button[data-tab-id="${item.id || `tab-${data.tabs.findIndex(t => t.title === item.title)}`}"]`);
        if (tabButton) tabButton.classList.add('active-tab');
      }

      const itemContent = contentData.find(content => content.subtabId === item.id);
      if (!itemContent) {
        contentContainer.innerHTML = '<p>No content defined for this item.</p>';
        return;
      }

      const pageTitle = document.createElement('h3');
      pageTitle.className = 'sub-content-header mb-3';
      pageTitle.textContent = item.subtabs ? item.title : `${tabTitle} > ${item.title}`;
      contentContainer.appendChild(pageTitle);

      if (item.description) {
        const description = document.createElement('p');
        description.className = 'sub-content-description mb-3';
        description.textContent = item.description;
        contentContainer.appendChild(description);
      }

      let itemData = {};
      if (item.fetchFromAPI) {
        // fetchFromAPI varsa direkt endpoint’ten veri çek
        const response = await fetch(item.fetchFromAPI);
        if (!response.ok) throw new Error(`Failed to fetch data from ${item.fetchFromAPI}`);
        itemData = await response.json();
      } else if (item.fetchData !== false) {
        // fetchData false değilse Api.fetchSubtabData’yı kullan
        itemData = await Api.fetchSubtabData(item) || {};
      }

      const inputElements = {};

      function renderItem(item, parentElement) {
        let element;
        if (item.type === 'categoryDiv') {
          const categoryDiv = document.createElement('div');
          categoryDiv.className = 'category-div';
          categoryDiv.id = item.id;
          const categoryTitle = document.createElement('h4');
          categoryTitle.textContent = item.title || 'Kategori';
          categoryDiv.appendChild(categoryTitle);
          item.items.forEach(subItem => renderItem(subItem, categoryDiv));
          parentElement.appendChild(categoryDiv);
          return;
        }

        if (item.type === 'listItem') {
          const listContainer = document.createElement('div');
          listContainer.className = 'list-item-container';
          listContainer.id = item.id;
          const listTitle = document.createElement('h4');
          listTitle.textContent = item.label || 'Liste';
          listContainer.appendChild(listTitle);

          const listItems = document.createElement('div');
          listItems.className = 'list-items';

          item.items.forEach((listItem, index) => {
            const listItemDiv = document.createElement('div');
            listItemDiv.className = 'list-item';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.id = `${item.id}-${index}`;
            input.value = listItem.value || '';
            input.placeholder = listItem.label || 'Öğe';
            listItemDiv.appendChild(input);
            listItems.appendChild(listItemDiv);
            inputElements[`${item.id}-${index}`] = input;
          });

          const addButton = document.createElement('button');
          addButton.className = 'btn btn-primary mt-2';
          addButton.textContent = item.addButtonLabel || 'Ekle';
          addButton.onclick = () => {
            const newIndex = listItems.children.length;
            const newItemDiv = document.createElement('div');
            newItemDiv.className = 'list-item';
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.className = 'form-control';
            newInput.id = `${item.id}-${newIndex}`;
            newInput.placeholder = 'Yeni Öğe';
            newItemDiv.appendChild(newInput);
            listItems.appendChild(newItemDiv);
            inputElements[`${item.id}-${newIndex}`] = newInput;
          };

          listContainer.appendChild(listItems);
          listContainer.appendChild(addButton);
          parentElement.appendChild(listContainer);
          return;
        }

        if (item.type === 'customList') {
          const listContainer = document.createElement('div');
          listContainer.className = 'custom-list-container';
          listContainer.id = item.id;
          const listTitle = document.createElement('h4');
          listTitle.textContent = item.label || 'Özelleştirilmiş Liste';
          listContainer.appendChild(listTitle);

          const table = document.createElement('table');
          table.className = 'custom-list-table';

          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          item.fields.forEach(field => {
            const th = document.createElement('th');
            th.textContent = field.label;
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);

          const tbody = document.createElement('tbody');
          
          fetch(item.dataSource)
            .then(response => {
              if (!response.ok) throw new Error(`Failed to fetch data from ${item.dataSource}`);
              return response.json();
            })
            .then(listItems => {
              listItems.forEach((listItem, rowIndex) => {
                const row = document.createElement('tr');
                item.fields.forEach(field => {
                  const td = document.createElement('td');
                  const input = createFieldElement(field, `${item.id}-${rowIndex}-${field.id}`, listItem[field.id]);
                  td.appendChild(input);
                  row.appendChild(td);
                  inputElements[`${item.id}-${rowIndex}-${field.id}`] = input;
                });
                tbody.appendChild(row);
              });
            })
            .catch(error => {
              const errorRow = document.createElement('tr');
              const errorCell = document.createElement('td');
              errorCell.colSpan = item.fields.length;
              errorCell.textContent = `Veri yüklenemedi: ${error.message}`;
              errorRow.appendChild(errorCell);
              tbody.appendChild(errorRow);
            });

          table.appendChild(tbody);
          listContainer.appendChild(table);
          parentElement.appendChild(listContainer);
          return;
        }

        switch (item.type) {
          case 'text':
          case 'password':
            element = document.createElement('input');
            element.type = item.type;
            element.className = 'form-control mb-2';
            element.id = item.id;
            element.placeholder = item.label;
            element.value = itemData[item.id] || '';
            if (item.readonly) element.readOnly = true;
            inputElements[item.id] = element;
            break;
          case 'number':
            element = document.createElement('input');
            element.type = 'number';
            element.className = 'form-control mb-2';
            element.id = item.id;
            element.placeholder = item.label;
            element.value = itemData[item.id] || '';
            if (item.min) element.min = item.min;
            if (item.max) element.max = item.max;
            inputElements[item.id] = element;
            break;
          case 'textarea':
            element = document.createElement('textarea');
            element.className = 'form-control mb-2';
            element.id = item.id;
            element.placeholder = item.label;
            element.value = itemData[item.id] || '';
            if (item.readonly) element.readOnly = true;
            inputElements[item.id] = element;
            break;
          case 'textValue':
            element = document.createElement('div');
            element.className = 'text-value mb-2';
            element.id = item.id;

            const textSpan = document.createElement('span');
            textSpan.className = 'text-value-label';
            textSpan.textContent = item.text || 'No text defined';

            const valueSpan = document.createElement('span');
            valueSpan.className = 'text-value-content';
            valueSpan.textContent = itemData[item.id] || 'No value';

            element.appendChild(textSpan);
            element.appendChild(document.createTextNode(': '));
            element.appendChild(valueSpan);
            break;
          case 'select':
            element = document.createElement('select');
            element.className = 'form-select mb-2';
            element.style.maxWidth = '200px';
            element.id = item.id;
            item.options.forEach(option => {
              const optionElement = document.createElement('option');
              optionElement.value = option.value;
              optionElement.textContent = option.text;
              element.appendChild(optionElement);
            });
            element.value = itemData[item.id] || item.options[0].value;
            inputElements[item.id] = element;
            break;
          case 'checkbox':
            element = document.createElement('input');
            element.type = 'checkbox';
            element.className = 'form-check-input me-2';
            element.id = item.id;
            element.checked = itemData[item.id] !== undefined ? itemData[item.id] : item.checked || false;
            inputElements[item.id] = element;
            break;
          case 'radio':
            element = document.createElement('div');
            element.className = 'form-check';
            item.options.forEach((option, index) => {
              const radioWrapper = document.createElement('div');
              radioWrapper.className = 'form-check';
              const radio = document.createElement('input');
              radio.type = 'radio';
              radio.className = 'form-check-input';
              radio.name = item.id;
              radio.id = `${item.id}-${index}`;
              radio.value = option.value;
              radio.checked = itemData[item.id] === option.value || (option.checked && !itemData[item.id]);
              const radioLabel = document.createElement('label');
              radioLabel.className = 'form-check-label';
              radioLabel.setAttribute('for', `${item.id}-${index}`);
              radioLabel.textContent = option.text;
              radioWrapper.appendChild(radio);
              radioWrapper.appendChild(radioLabel);
              element.appendChild(radioWrapper);
            });
            inputElements[item.id] = {
              get value() {
                const checkedRadio = element.querySelector('input[type="radio"]:checked');
                return checkedRadio ? checkedRadio.value : null;
              }
            };
            break;
          case 'file':
            element = document.createElement('input');
            element.type = 'file';
            element.className = 'form-control mb-2';
            element.id = item.id;
            if (item.accept) element.accept = item.accept;
            inputElements[item.id] = element;
            break;
          case 'button':
            element = document.createElement('button');
            element.className = 'btn btn-primary mb-2';
            element.textContent = item.label;
            element.id = item.id;
            if (item.action) {
              element.onclick = async () => {
                const inputs = {};
                Object.keys(inputElements).forEach(id => {
                  inputs[id] = inputElements[id].value;
                });
                const result = await Api.triggerAction(item.action, inputs);
                if (typeof result === 'object') {
                  Object.keys(result).forEach(id => {
                    if (inputElements[id]) inputElements[id].value = result[id];
                  });
                } else {
                  alert(result);
                }
              };
            }
            break;
          case 'statusLed':
            element = document.createElement('div');
            element.className = `status-led ms-2 ${itemData[item.id] ? 'led-green' : 'led-red'}`;
            element.id = item.id;
            inputElements[item.id] = element;
            break;
          case 'label':
            element = document.createElement('p');
            element.textContent = item.text;
            element.id = item.id;
            break;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'mb-3';
        if (item.type !== 'label' && item.type !== 'button') {
          const label = document.createElement('label');
          label.textContent = item.label;
          label.setAttribute('for', item.id);
          wrapper.appendChild(label);
        }
        if (element) wrapper.appendChild(element);
        parentElement.appendChild(wrapper);
      }

      function createFieldElement(field, id, value) {
        let element;
        switch (field.type) {
          case 'text':
          case 'password':
            element = document.createElement('input');
            element.type = field.type;
            element.id = id;
            element.value = value || '';
            break;
          case 'number':
            element = document.createElement('input');
            element.type = 'number';
            element.id = id;
            element.value = value || '';
            if (field.min) element.min = field.min;
            if (field.max) element.max = field.max;
            break;
          case 'select':
            element = document.createElement('select');
            element.id = id;
            field.options.forEach(option => {
              const opt = document.createElement('option');
              opt.value = option.value;
              opt.textContent = option.text;
              if (value === option.value) opt.selected = true;
              element.appendChild(opt);
            });
            break;
          case 'checkbox':
            element = document.createElement('input');
            element.type = 'checkbox';
            element.id = id;
            element.checked = value || false;
            break;
        }
        return element;
      }

      itemContent.items.forEach(item => renderItem(item, contentContainer));
    }
  })
  .catch(error => {
    document.getElementById('content').innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  });

// Hamburger menu and sidebar control
document.getElementById('menuToggle').addEventListener('click', function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
});

document.getElementById('sidebarOverlay').addEventListener('click', function () {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
});

document.addEventListener('click', function (event) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');
  if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }
});