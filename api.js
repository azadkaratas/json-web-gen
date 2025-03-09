// api.js
export class Api {

  // Fetch subtab data, using dataSource if specified, otherwise default to {subtabId}.json
  static async fetchSubtabData(subtab) {
    try {
      const fetchUrl = subtab.dataSource || `${subtab.id}.json`;
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`Failed to fetch data from ${fetchUrl}`);
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

    // Generic action (for user defined actions)
    static async triggerAction(action, inputs) {
      if (typeof this[action] === 'function') {
        return await this[action](inputs);
      } else {
        console.warn(`Undefined action: ${action}`);
        return `Error: ${action} function is not defined in api.js`;
      }
    }

  }