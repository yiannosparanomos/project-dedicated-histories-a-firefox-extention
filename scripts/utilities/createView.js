import {handleGoToView, iconMapping, populateContainerList} from '../utilities/general.js';


// Utility Functions
async function isNameExists(name) {
    const existingProfiles = await browser.storage.local.get();
    return Object.values(existingProfiles).some(profile => profile.profileName === name);
}

function displayExistingProfileError(message) {
    const errorMsg = document.getElementById('profileName');
    if (errorMsg) {
        errorMsg.placeholder = message;
            setTimeout(() => {
            errorMsg.placeholder = "Profile Name";
        }, 6000);
    } else {
        console.error("Profile name input element not found in the DOM.");
    }
}


// -------------- Create Profile --------------
export const handleCreateProfile = async (profileNameInput, popupContainerList, containersListView, manageContainerList) => {
    if(!(profileNameInput || popupContainerList || containersListView || manageContainerList)){
        return;}
    
    const profileName = profileNameInput.value.trim();
    profileNameInput.value = '';
    if (!profileName) return displayExistingProfileError("Something is missing...");
    if (await isNameExists(profileName)) return displayExistingProfileError("Be more unique!");

    // Ensure contextual identities/containers are available
    if (!browser.contextualIdentities || !browser.contextualIdentities.create) {
        return displayExistingProfileError("Enable Firefox containers (about:config)");
    }

    // Capture the selected color
    const selectedColorBehindElement = document.querySelector('.colorGroup .colors .colorWrapper .colorBehind.selected');

    let selectedColor = "blue"; // default color
    if (selectedColorBehindElement) {
        const associatedColorElement = selectedColorBehindElement.parentElement.querySelector('.color');
        if (associatedColorElement && associatedColorElement.id) {
            selectedColor = associatedColorElement.id;
        }
    }

    // Capture the selected icon
    const selectedIconElement = document.querySelector('.iconGroup .icons .material-icons.selected, .iconGroup .icons .material-symbols-outlined.selected');
    const selectedIcon = selectedIconElement ? selectedIconElement.textContent : "fingerprint"; // Using the icon's text content
    const containerIcon = iconMapping[selectedIcon];

    const response = await browser.runtime.sendMessage({ 
        command: "createContainer", 
        name: profileName,
        color: selectedColor,      
        icon: containerIcon         
    });
    if (response && response.success !== false) {
        await populateContainerList(popupContainerList, containersListView, manageContainerList);
        handleGoToView("mainView");
    } else {
        displayExistingProfileError("Failed to create profile");
    }
    // console.log('profile created: ', response, ' with name: ', profileName, ' color: ', selectedColor, ' icon: ', selectedIcon);
    resetSelections(profileNameInput);
}

export const resetSelections = async (profileNameInput) => {
    if (profileNameInput) {
        profileNameInput.value = '';
        profileNameInput.placeholder = "Profile Name"; // Reset placeholder if needed
    }
    // Deselect colors
    document.querySelectorAll('.colorGroup .colors .colorBehind').forEach(el => el.classList.remove('selected'));
    // Deselect icons
    document.querySelectorAll('.iconGroup .icons .material-icons, .iconGroup .icons .material-symbols-outlined').forEach(el => el.classList.remove('selected'));
};


// --------------- Enter Key Handler ---------------
export const handleEnterKeyForProfile = (e, profileNameInput, popupContainerList, containersListView, manageContainerList) => {
    if (e.key === "Enter") {
        e.preventDefault();
        handleCreateProfile(profileNameInput, popupContainerList, containersListView, manageContainerList);
    }
};


// Profile Icon and Color Selection Functions 
export const handleProfileCardFocusIn = (event) => {
    if (event.target.classList.contains('color')) {
        let parentWrapper = event.target.closest('.colorWrapper');
        if (parentWrapper) {
            let colorBehind = parentWrapper.querySelector('.colorBehind');
            if (colorBehind) {
                colorBehind.setAttribute("style", "border: 1px solid #74f3ed;");
                colorBehind.classList.add('focused');
            }
        }
    } else if (event.target.classList.contains('material-icons') || event.target.classList.contains('material-symbols-outlined')) {
        event.target.setAttribute("style", "border: 1px solid #74f3ed;");
        event.target.classList.add('focused');
    }
};

export const handleProfileCardFocusOut = (event) => {
    if (event.target.classList.contains('color')) {
        let parentWrapper = event.target.closest('.colorWrapper');
        if (parentWrapper) {
            let colorBehind = parentWrapper.querySelector('.colorBehind');
            if (colorBehind) {
                colorBehind.setAttribute("style", "border: 1px solid transparent;");
                colorBehind.classList.remove('focused');
            }
        }
    } else if (event.target.classList.contains('material-icons') || event.target.classList.contains('material-symbols-outlined')) {
        event.target.setAttribute("style", "border: 1.5px solid transparent;");
        event.target.classList.remove('focused');
    }
};

export const handleProfileCardClick = (event) => {
if (event.target.classList.contains('color')) {
        document.querySelectorAll('.colorGroup .colors .colorBehind').forEach(el => el.classList.remove('selected'));
        let parentWrapper = event.target.closest('.colorWrapper');
        if (parentWrapper) {
            let colorBehind = parentWrapper.querySelector('.colorBehind');
            if (colorBehind) {
                colorBehind.classList.add('selected');
            }
        }
    } else if (event.target.classList.contains('material-icons') || event.target.classList.contains('material-symbols-outlined')) {
        document.querySelectorAll('.iconGroup .icons .material-icons, .iconGroup .icons .material-symbols-outlined').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
    }
};
