// Fetch the configuration file (config.json) to initialize the application
fetch('config.json')
  .then(response => {
    if (!response.ok) throw new Error('Config file could not be loaded');
    return response.json();
  })
  .then(data => {
    document.title = data.title || 'Device Configuration';

    const accordionContainer = document.getElementById('accordion');
    const contentContainer = document.getElementById('content');

    // --- Customize the header and sidebar ---
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

    // --- Generate accordion tabs dynamically ---
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

    // --- Fetch data for an individual item with hierarchical fallback ---
    async function fetchItemData(item) {
      let itemData = {};
      if (item.fetchFromAPI) {
        try {
          const response = await fetch(item.fetchFromAPI);
          if (!response.ok) throw new Error(`Failed to fetch data from ${item.fetchFromAPI}`);
          if (item.type === 'fileReader') {
            itemData = await response.text();
          } else {
            itemData = await response.json();
          }
        } catch (error) {
          console.error(`Error fetching from ${item.fetchFromAPI}:`, error);
          return item.type === 'fileReader' ? `Hata: ${error.message}` : {};
        }
      } else if (item.fetchData !== false && item.dataSource) {
        try {
          itemData = await fetchSubtabData(item) || {};
        } catch (error) {
          console.error(`Error fetching from dataSource:`, error);
          return {};
        }
      }
      return itemData;
    }

    async function fetchSubtabData(subtab) {
      try {
        const fetchUrl = subtab.dataSource || `${subtab.id}.json`;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Veri çekilemedi: ${fetchUrl}`);
        return await response.json();
      } catch (error) {
        console.error('Hata:', error);
        return null;
      }
    }

    async function triggerAction(action, inputs) {
      console.warn(`Undefined action: ${action}`);
      return `Hata: ${action} fonksiyonu script.js'de tanımlı değil`;
    }

    // --- Function to display content for a tab or subtab ---
    async function showContent(item, contentData, tabTitle) {
      const header = document.querySelector('header');
      header.setAttribute('data-breadcrumb', item.subtabs ? item.title : `${tabTitle} > ${item.title}`);
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

      // Sabit başlık için kapsayıcı
      const headerContainer = document.createElement('div');
      headerContainer.className = 'fixed-header';

      const pageTitle = document.createElement('h3');
      pageTitle.className = 'sub-content-header mb-0'; // mb-0 ile alt boşluğu kaldır
      pageTitle.textContent = item.subtabs ? item.title : `${tabTitle} > ${item.title}`;
      headerContainer.appendChild(pageTitle);

      // Kaydırılabilir içerik için kapsayıcı
      const scrollableContent = document.createElement('div');
      scrollableContent.className = 'scrollable-content';

      if (item.description) {
        const description = document.createElement('p');
        description.className = 'sub-content-description mb-3';
        description.textContent = item.description;
        scrollableContent.appendChild(description);
      }

      // contentContainer’a ekle
      contentContainer.appendChild(headerContainer);
      contentContainer.appendChild(scrollableContent);

      const inputElements = {};
      let subtabData = {};
      if (item.fetchFromAPI) {
        subtabData = await fetchItemData(item);
      }

      // --- Render an individual item (e.g., input, button, list) ---
      async function renderItem(item, parentElement, parentData = {}, parentItem = null, subtabItem = null) {
        let element;
        // Use item's own data if fetchFromAPI exists, otherwise use parentData or subtabData
        let itemData = item.fetchFromAPI ? await fetchItemData(item) : (parentData && Object.keys(parentData).length > 0 ? parentData : subtabData);

        // Check if fetch failed (empty itemData) and item relies on fetchFromAPI at any level
        const fetchFailed = (item.fetchFromAPI || (parentItem && parentItem.fetchFromAPI) || (subtabItem && subtabItem.fetchFromAPI)) && Object.keys(itemData).length === 0;

        switch (item.type) {
          case 'text':
          case 'password':
            element = document.createElement('input');
            element.type = item.type;
            element.className = 'form-control mb-2';
            element.id = item.id;
            element.placeholder = item.label;
            element.value = fetchFailed ? 'No content available' : (itemData[item.id] || item.value || '');
            if (item.readonly) element.readOnly = true;
            inputElements[item.id] = element;
            break;
          case 'number':
            element = document.createElement('input');
            element.type = 'number';
            element.className = 'form-control mb-2';
            element.id = item.id;
            element.placeholder = item.label;
            element.value = fetchFailed ? 'No content available' : (itemData[item.id] || item.value || '');
            if (item.min) element.min = item.min;
            if (item.max) element.max = item.max;
            inputElements[item.id] = element;
            break;
          case 'textarea':
            element = document.createElement('textarea');
            element.className = 'form-control mb-2';
            element.id = item.id;
            element.placeholder = item.label;
            element.value = fetchFailed ? 'No content available' : (itemData[item.id] || item.value || '');
            if (item.readonly) element.readOnly = true;
            inputElements[item.id] = element;
            break;
          case 'textValue':
            element = document.createElement('div');
            element.className = 'text-value mb-3';
            element.id = item.id;

            const textSpan = document.createElement('span');
            textSpan.className = 'text-value-label';
            textSpan.textContent = item.text || 'No text defined';

            const valueSpan = document.createElement('span');
            valueSpan.className = 'text-value-content';
            valueSpan.textContent = fetchFailed ? 'No content available' : (itemData[item.id] || item.value || 'No value');

            element.appendChild(textSpan);
            element.appendChild(document.createTextNode(': '));
            element.appendChild(valueSpan);
            break;
          case 'select':
            element = document.createElement('select');
            element.className = 'form-select mb-2';
            element.style.maxWidth = '200px';
            element.id = item.id;
            if (fetchFailed) {
              const optionElement = document.createElement('option');
              optionElement.textContent = 'No content available';
              element.appendChild(optionElement);
            } else {
              item.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.text;
                element.appendChild(optionElement);
              });
              element.value = itemData[item.id] || item.value || item.options[0].value;
            }
            inputElements[item.id] = element;
            break;
          case 'checkbox':{
            element = document.createElement('div');
            element.className = 'checkbox-container d-flex align-items-center mb-2';
            element.id = item.id;
          
            // Left label
            const label = document.createElement('span');
            label.className = 'checkbox-label me-3';
            label.textContent = item.label || 'Seçenek';
          
            // Right checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'custom-checkbox';
            checkbox.checked = fetchFailed ? false : (itemData[item.id] !== undefined ? itemData[item.id] : item.checked || false);
            if (item.readonly || fetchFailed) checkbox.disabled = true;
          
            element.appendChild(label);
            element.appendChild(checkbox);
            inputElements[item.id] = checkbox;
            }
            break;
          case 'radio':
            element = document.createElement('div');
            element.className = 'form-check';
            if (fetchFailed) {
              const errorLabel = document.createElement('span');
              errorLabel.textContent = 'No content available';
              element.appendChild(errorLabel);
            } else {
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
            }
            inputElements[item.id] = fetchFailed ? element : {
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
            if (fetchFailed) element.disabled = true; // Disable file input if fetch fails
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
                const result = await triggerAction(item.action, inputs);
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
            element.className = 'status-led-container d-flex align-items-center mb-2';
            element.id = item.id;
          
            const label = document.createElement('span');
            label.className = 'status-led-label me-3';
            label.textContent = item.label || 'Durum';
          
            const led = document.createElement('div');
            led.className = `status-led ${fetchFailed ? 'led-red' : (itemData[item.id] ? 'led-green' : 'led-red')}`;
            
            element.appendChild(label);
            element.appendChild(led);
            inputElements[item.id] = led;
            break;
          case 'label':
            element = document.createElement('p');
            element.textContent = fetchFailed ? 'No content available' : item.text;
            element.id = item.id;
            break;
          case 'categoryDiv':
            element = document.createElement('div');
            element.className = 'category-div';
            element.id = item.id;
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = item.title || 'Category';
            element.appendChild(categoryTitle);

            // Render child items, passing categoryData as parentData
            for (const subItem of item.items) {
              await renderItem(subItem, element, itemData, item, subtabItem);
            }
            break;
          case 'customList':
            element = document.createElement('div');
            element.className = 'custom-list-container';
            element.id = item.id;
            const listTitle = document.createElement('h4');
            listTitle.textContent = item.label || 'Custom List';
            element.appendChild(listTitle);

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
            const listItems = Array.isArray(itemData) ? itemData : itemData[item.id] || [];
            if (fetchFailed || (Array.isArray(listItems) && listItems.length === 0)) {
              const errorRow = document.createElement('tr');
              const errorCell = document.createElement('td');
              errorCell.colSpan = item.fields.length;
              errorCell.textContent = 'No content available';
              errorRow.appendChild(errorCell);
              tbody.appendChild(errorRow);
            } else {
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
            }

            table.appendChild(tbody);
            element.appendChild(table);
            break;
          case 'listItem':{
            element = document.createElement('div');
            element.className = 'list-item-container';
            element.id = item.id;
            const listTitle = document.createElement('h4');
            listTitle.textContent = item.label || 'List';
            element.appendChild(listTitle);

            const listItems = document.createElement('div');
            listItems.className = 'list-items';

            item.items.forEach((listItem, index) => {
              const listItemDiv = document.createElement('div');
              listItemDiv.className = 'list-item';
              const input = document.createElement('input');
              input.type = 'text';
              input.className = 'form-control';
              input.id = `${item.id}-${index}`;
              input.value = fetchFailed ? 'No content available' : (listItem.value || '');
              input.placeholder = listItem.label || 'Item';
              listItemDiv.appendChild(input);
              listItems.appendChild(listItemDiv);
              inputElements[`${item.id}-${index}`] = input;
            });

            const addButton = document.createElement('button');
            addButton.className = 'btn btn-primary mt-2';
            addButton.textContent = item.addButtonLabel || 'Add';
            addButton.onclick = () => {
              const newIndex = listItems.children.length;
              const newItemDiv = document.createElement('div');
              newItemDiv.className = 'list-item';
              const newInput = document.createElement('input');
              newInput.type = 'text';
              newInput.className = 'form-control';
              newInput.id = `${item.id}-${newIndex}`;
              newInput.placeholder = 'New Item';
              newItemDiv.appendChild(newInput);
              listItems.appendChild(newItemDiv);
              inputElements[`${item.id}-${newIndex}`] = newInput;
            };

            element.appendChild(listItems);
            element.appendChild(addButton);}
            break;
          case 'fileReader':
            element = document.createElement('div');
            element.className = 'file-reader-container';
            element.id = item.id;
          
            const textArea = document.createElement('textarea');
            textArea.style.overflowY = 'auto';
            textArea.readOnly = true;
            textArea.id = `${item.id}-content`;
          
            if (item.fetchFromAPI) {
              fetch(item.fetchFromAPI)
                .then(response => {
                  if (!response.ok) throw new Error('Dosya yüklenemedi');
                  return response.text();
                })
                .then(content => {
                  textArea.value = content;
                })
                .catch(error => {
                  textArea.value = `Hata: ${error.message}`;
                });
            } else {
              textArea.value = 'Hata: fetchFromAPI tanımlı değil';
            }
          
            element.appendChild(textArea);
            break;
        }

        const wrapper = document.createElement('div');
        if (item.type !== 'label' && item.type !== 'button' && 
            item.type !== 'customList' && item.type !== 'listItem' && 
            item.type !== 'categoryDiv' && item.type !== 'textValue' &&
            item.type !== 'statusLed' && item.type !== 'checkbox' ) {
          const label = document.createElement('label');
          label.textContent = item.label;
          label.setAttribute('for', item.id);
          wrapper.appendChild(label);
        }
        if (element) wrapper.appendChild(element);
        parentElement.appendChild(wrapper);
      }

      // --- Helper function to create field elements for customList ---
      function createFieldElement(field, id, value) {
        let element;
        switch (field.type) {
          case 'text':
          case 'password':
            element = document.createElement('input');
            element.type = field.type;
            element.id = id;
            element.value = value || '';
            if (field.readonly) element.disabled = true;
            break;
          case 'number':
            element = document.createElement('input');
            element.type = 'number';
            element.id = id;
            element.value = value || '';
            if (field.min) element.min = field.min;
            if (field.max) element.max = field.max;
            if (field.readonly) element.disabled = true;
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
            if (field.readonly) element.disabled = true;
            break;
        }
        return element;
      }

      // Render all items, passing subtab data as fallback
      for (const contentItem of itemContent.items) {
        await renderItem(contentItem, scrollableContent, subtabData, null, item);
      }
    }
  })
  .catch(error => {
    document.getElementById('content').innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
  });

// --- Sidebar toggle controls ---
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
