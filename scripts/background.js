// MV2 background uses browserAction; keep icon setup here (popup handles its own icon via manifest)
browser.browserAction.setIcon({ path: "../icons/history-mod.png" });

let lastActiveTabId = null;
const storeName = "history";

/**
 * Opens a connection to the IndexedDB.
 * @param {string} dbName - The name of the database.
 * @returns {Promise<IDBDatabase>} A promise that resolves to the IDBDatabase object.
 */
function openDatabase(dbName) {
    const version = 1;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        request.onerror = event => {
            console.error("Database error: ", event.target.error);
            reject(event.target.error);
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
            }
        };
    });
}

/**
 * Adds a history entry to the IndexedDB.
 * @param {string} dbName - The name of the database.
 * @param {Object} historyEntry - The history entry to add.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function addHistoryEntry(dbName, historyEntry) {
    const db = await openDatabase(dbName);
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.add(historyEntry);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = event => reject(event.target.error);
    }).finally(() => {
        db.close();
    });
}

browser.runtime.onMessage.addListener(async message => {
    try {
        switch (message.command) {
            case "getLastActiveTabInfo":
                const tabInfo = lastActiveTabId;
                lastActiveTabId = null; // Reset the lastActiveTabId after sending it
                return { tabInfo };
            case "createContainer":
                const success = await createContainer(message.name, message.color, message.icon);
                return { success };
            default:
                console.error('Unknown command received:', message.command);
                return { success: false, error: 'Unknown command' };
        }
    } catch (error) {
        console.error('Error handling message:', message, 'Error:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
});


async function openHistoryForActiveTab() {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
        const storedData = await browser.storage.local.get(activeTab.cookieStoreId);
        const profileName = storedData[activeTab.cookieStoreId]?.profileName || "Unknown Profile";
        if (profileName !== "Unknown Profile") {
            lastActiveTabId = activeTab.cookieStoreId;
        }
    }

    browser.windows.create({
        url: browser.runtime.getURL('../views/history.html?lastActiveTabId=' + lastActiveTabId),            type: "popup",
        height: 400,
        width: 600
    });
}


// browser.commands.onCommand.addListener(async command => {
//     if (command === "open_history") {
        
//     }
// });


async function createContainer(name, selectedColor, selectedIcon) {
    if (!name) {
        console.error("Trying to create a container with no name!");
        return false;
    }

    try {
        const context = await browser.contextualIdentities.create({
            name: name,
            color: selectedColor,
            icon: selectedIcon
        });

        const containerData = {
            [context.cookieStoreId]: {
                profileName: name,
                cookieStoreId: context.cookieStoreId,
                color: selectedColor, 
                icon: selectedIcon 
            }
        };
        
        await browser.storage.local.set(containerData);
        
        try {
            const createdDB = await openDatabase(name);
            createdDB.close();

        } catch (error) {
            console.error("Error opening/creating database for container:", name, error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Error in createContainer:", error);
        return false;
    }
}

browser.webNavigation.onCompleted.addListener(async details => {
    if (details.frameId !== 0 || details.url.startsWith('moz-extension:') || details.url === "about:newtab") {
        return;
    }

    const tab = await browser.tabs.get(details.tabId);
    const containerId = tab.cookieStoreId;
    const storedData = await browser.storage.local.get(containerId);
    
    if (!storedData[containerId]) {
        return;
    }
    
    const profileName = storedData[containerId].profileName;
    const historyEntry = {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        profileName: profileName,
        cookieStoreId: containerId
    };

    try {
        await addHistoryEntry(profileName, historyEntry);
    } catch (error) {
        console.error("Error adding history entry:", error);
    }
});
