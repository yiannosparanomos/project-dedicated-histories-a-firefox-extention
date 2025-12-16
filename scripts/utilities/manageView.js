import {populateContainerList, displayError, getExistingProfiles} from '../utilities/general.js';

const notify = (message) => {
    // Simple user-facing notification
    alert(message);
};


async function closeTabsForProfile(profileToDelete) {
    try {
        const tabs = await browser.tabs.query({});
        const tabsToClose = [];

        for (const tab of tabs) {
            const storedData = await browser.storage.local.get(tab.cookieStoreId);

            const profileName = storedData[tab.cookieStoreId]?.profileName || "Unknown Profile";
            if (profileName === profileToDelete) {
                tabsToClose.push(tab.id);
            }
        }
        if (tabsToClose.length) {
            await browser.tabs.remove(tabsToClose);
        }
    } catch (error) {
        console.error('Error while closing tabs for profile:', error);
    }
}

const deleteIndexedDBHistory = async (profile) => {
    const dbName = profile.profileName;
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
            // console.log(`IndexedDB database '${dbName}' deleted successfully.`);
            resolve();
        };
        request.onerror = () => {
            console.error(`Failed to delete IndexedDB database '${dbName}'.`);
            reject(request.error);
        };
    });
};

const refreshContainerLists = async () => {
    const containerList = document.getElementById('containerListId');
    const containersListView = document.getElementById('containersListViewId');
    const manageContainerList = document.getElementById('manageContainerListId');
    if (containerList && containersListView && manageContainerList) {
        await populateContainerList(containerList, containersListView, manageContainerList);
    }
};

const executeProfileDeletion = async (selectedProfileKey, profiles) => {
    try {
        if (selectedProfileKey === "allProfiles") {
            if (!confirm("Are you sure you want to delete all profiles?")) return;
            
            for (let profile of profiles) {
                await closeTabsForProfile(profile.profileName);
                await deleteIndexedDBHistory(profile);
                await browser.contextualIdentities.remove(profile.cookieStoreId);
                await browser.storage.local.remove(profile.key);
            }
        } else {
            const profileToDelete = profiles.find(profile => profile.key === selectedProfileKey);
            if (!profileToDelete) {
                throw new Error("No profile found for the selected key. Cannot delete.");
            }
            await closeTabsForProfile(profileToDelete.profileName);
            await deleteIndexedDBHistory(profileToDelete);
            await browser.contextualIdentities.remove(profileToDelete.cookieStoreId);
            await browser.storage.local.remove(selectedProfileKey);
        }

        // console.log("Profile(s) deleted successfully!");
    } catch (error) {
        console.error("Error deleting profile:", error);
        displayError("Failed to delete profile(s). Please try again.");
    }
};

const handleDeleteProfile = async () => {
    // TODO: wire UI selection; defaulting to delete all for now
    const selectedProfileKey = "allProfiles";
    const profiles = await getExistingProfiles();

    if (profiles.length === 0) return displayError("No profiles to delete!");
    if (!selectedProfileKey) return;

    try {
        await executeProfileDeletion(selectedProfileKey, profiles);
        // await populateDeleteDropdown();
        await refreshContainerLists();
    } catch (error) {
        console.error("Error deleting profile:", error);
        displayError("Failed to delete profile. Please try again.");
    }
};

const handleClearHistory = async (profile) => {
    try {
        await deleteIndexedDBHistory(profile);
        await refreshContainerLists();
        notify(`History cleared (or none existed) for "${profile.profileName}".`);
    } catch (error) {
        console.error("Error clearing history:", error);
        displayError("Failed to clear history. Please try again.");
        notify("Failed to clear history. Please try again.");
    }
};

const handleManageActionClick = async (event) => {
    const actionIcon = event.target.closest('.manageActionIcon');
    if (!actionIcon) return;

    const manageRow = event.target.closest('[data-key]');
    if (!manageRow) return displayError("Profile not found.");

    const profileKey = manageRow.getAttribute('data-key');
    const profiles = await getExistingProfiles();
    const profile = profiles.find(p => p.key === profileKey);
    if (!profile) return displayError("Profile not found.");

    const imgSrc = actionIcon.querySelector('img')?.src || '';

    if (imgSrc.includes('trash')) {
        if (confirm(`Delete profile "${profile.profileName}"?`)) {
            await executeProfileDeletion(profileKey, profiles);
            await refreshContainerLists();
            notify(`Profile "${profile.profileName}" deleted.`);
        }
    } else if (imgSrc.includes('clear')) {
        if (confirm(`Clear history for "${profile.profileName}"?`)) {
            await handleClearHistory(profile);
        }
    } else if (imgSrc.includes('customize')) {
        displayError("Customize behaviour is not implemented yet.");
        notify("Customize behaviour is not implemented yet.");
    }
};

// Initialize manage view listeners after views are loaded
export const initManageViewListeners = () => {
    const deleteAllBtn = document.getElementById('deleteAllProfiles');
    if (deleteAllBtn && !deleteAllBtn.dataset.bound) {
        deleteAllBtn.addEventListener('click', handleDeleteProfile);
        deleteAllBtn.dataset.bound = "true";
    }

    const manageContainerList = document.getElementById('manageContainerListId');
    if (manageContainerList && !manageContainerList.dataset.bound) {
        manageContainerList.addEventListener('click', handleManageActionClick);
        manageContainerList.dataset.bound = "true";
    }
};
