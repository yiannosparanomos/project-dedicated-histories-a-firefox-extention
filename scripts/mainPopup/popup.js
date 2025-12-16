import {handleGoToView, populateContainerList} from '../utilities/general.js'
import {handleCreateProfile, handleEnterKeyForProfile, handleProfileCardFocusIn, handleProfileCardFocusOut, handleProfileCardClick} from '../utilities/createView.js'
import {filterContainerList, handleSearchHistory, displayProfileHistory} from '../utilities/historyView.js'
import {initManageViewListeners} from '../utilities/manageView.js'


// Global Variables
let openInSelectedProfile = false;
let initialGroupStates = {};


// DOM Elements to be loaded!
let mainView, createView, manageProfilesView, containersListView, informationPageView, historyPageView;
let views = {mainView, createView, manageProfilesView, containersListView, informationPageView, historyPageView};

let popupContainerList, manageContainerList;


function loadHTML(url, containerId) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, when loading ${url}`);
      }
      return response.text();
    })
    .then(data => {
      document.getElementById(containerId).innerHTML = data;
    });
}


function attachEventListeners() {

    // DOM Elements
    popupContainerList = document.getElementById('containerListId');
    containersListView = document.getElementById('containersListViewId');
    manageContainerList = document.getElementById('manageContainerListId');

    // Go To View Listeners
    const goToManageProfiles = document.getElementById('manageProfiles');
    if(goToManageProfiles){
        goToManageProfiles.addEventListener('click', () => handleGoToView("manageProfilesView"));
    }

    const goToInformationView = document.getElementById('goToInformationView');
    if(goToInformationView){
        goToInformationView.addEventListener('click', () => handleGoToView("informationPageView"));
    }

    const goToHistoyView = document.getElementById('goToHistoryView');
    if(goToHistoyView){
        goToHistoyView.addEventListener('click', () => handleGoToView("historyPageView"));
    }

    const profileNameInput = document.getElementById('profileName');
    const goToProfileViewButton = document.getElementById('goToProfileView');
    if(goToProfileViewButton){
        goToProfileViewButton.addEventListener('click', () => handleGoToView("createView", profileNameInput));
    }

    const goToCreateProfileManageProfiles = document.getElementById('manageCreateNewProfileId');
    if(goToCreateProfileManageProfiles){
        goToCreateProfileManageProfiles.addEventListener('click', () => handleGoToView("createView", profileNameInput));
    }

    // Main View Actions Listeners
    const reopenInDiv = document.getElementById('reopenInDivId');
    if(reopenInDiv){
        reopenInDiv.addEventListener('click', () => handleGoToView("containersListView"));
    }

    const alwaysOpenDiv = document.getElementById('alwaysOpenDivId');
    if(alwaysOpenDiv){
        alwaysOpenDiv.addEventListener('click', () => handleGoToView("containersListView"));
    }


    // Go To Main View (Back Button) Listeners
    const goToMainViewButton = document.getElementById('backButtonId');
    if(goToMainViewButton)
    {goToMainViewButton.addEventListener('click', () => handleGoToView("mainView"));}

    const manageGoToMainViewButton = document.getElementById('manageBackButtonId');
    if(manageGoToMainViewButton){
        manageGoToMainViewButton.addEventListener('click', () => handleGoToView("mainView"));
    }

    const infoGoToMainViewButton = document.getElementById('infoViewBackButtonId');
    if(infoGoToMainViewButton){
        infoGoToMainViewButton.addEventListener('click', () => handleGoToView("mainView"));
    }

    const containersListGoToMainViewButton = document.getElementById('containersListeBackButtonId');
    if(containersListGoToMainViewButton){
        containersListGoToMainViewButton.addEventListener('click', () => handleGoToView("mainView"));
    }

    const historyGoToMainViewButton = document.getElementById('historyBackButtonId');
    if(historyGoToMainViewButton){
        historyGoToMainViewButton.addEventListener('click', () => handleGoToView("mainView"));
    }


    // Create Profile View Listeners
    if(createView){
        createView.addEventListener('keydown', (e) => handleEnterKeyForProfile(e, profileNameInput, popupContainerList, containersListView, manageContainerList));
    }

    const createProfileButton = document.getElementById('createProfileOkButton');
    if(createProfileButton){
        createProfileButton.addEventListener('click', () => handleCreateProfile(profileNameInput, popupContainerList, containersListView, manageContainerList));
    }

    const profileCancelButton = document.getElementById('createProfileCancelButton');
    if(profileCancelButton){
        profileCancelButton.addEventListener('click', () => handleGoToView("mainView"));
    }

    const profileCardQuerySelector = document.querySelector('.profile-card');
    if(profileCardQuerySelector){
        profileCardQuerySelector.addEventListener('click', handleProfileCardClick);
        profileCardQuerySelector.addEventListener('focusin', handleProfileCardFocusIn);
        profileCardQuerySelector.addEventListener('focusout', handleProfileCardFocusOut);
    }

    const profileCardElements = document.getElementById('createProfilePageId');
    if(profileCardElements){
        profileCardElements.addEventListener('click', handleProfileCardClick);
    }


    // History View Listeners
    const searchHistoryField = document.getElementById('searchHistory');
    if(searchHistoryField){
        searchHistoryField.addEventListener('input', handleSearchHistory);
    }

    const profileSelectElement = document.getElementById('profileSelect');
    if(profileSelectElement){
        profileSelectElement.addEventListener('change', async (event) => {
            const selectedProfileName = event.target.value;
            await displayProfileHistory(selectedProfileName);
        });
    }


    // Main View Listeners
    const containerSearchField = document.getElementById('containerSearchId');
    if(containerSearchField){
        containerSearchField.addEventListener('input', (event) => {
            filterContainerList(event.target.value, 'containerListId');
        });
    }


    // Manage Profiles View Listeners
    const manageProfilesSearchField = document.getElementById('manageProfilesSearchId');
    if(manageProfilesSearchField){
        manageProfilesSearchField.addEventListener('input', (event) => {
            filterContainerList(event.target.value, 'manageContainerListId');
        });
    }


    // Containers List View Listeners
    const containersListViewSearchField = document.getElementById('containersListViewSearchId');
    if(containersListViewSearchField){
        containersListViewSearchField.addEventListener('input', (event) => {
            filterContainerList(event.target.value, 'containersListViewId');
        });
    }

    const toggleOpenInProfileButton = document.getElementById('toggleOpenInProfile');
    if(toggleOpenInProfileButton){
        toggleOpenInProfileButton.addEventListener('click', () => {
            openInSelectedProfile = !openInSelectedProfile;
            document.getElementById('toggleOpenInProfile').textContent = openInSelectedProfile ? "Open in Selected Profile" : "Open in Current Profile";
        });
    }

    // document.addEventListener('DOMContentLoaded', function() {
    //     checkForDeferredActions();
    // });

}


async function initializeApp() {
    try {
      // Load HTML views
        await Promise.all([
            loadHTML("../../views/mainView.html", "popupMainId"),
            loadHTML("../../views/createView.html", "createProfilePageId"),
            loadHTML("../../views/informationView.html", "informationPageId"),
            loadHTML("../../views/listView.html", "containersListPageId"),
            loadHTML("../../views/historyView.html", "historyPageId"),
            loadHTML("../../views/manageView.html", "manageProfilesPageId")
        ]);

        // Views DOM Elements
        mainView = document.getElementById('popupMainId');
        createView = document.getElementById('createProfilePageId');
        manageProfilesView = document.getElementById('manageProfilesPageId');
        containersListView = document.getElementById('containersListPageId');
        informationPageView = document.getElementById('informationPageId');
        historyPageView = document.getElementById('historyPageId');

        views = {
            mainView: document.getElementById('popupMainId'),
            createView: document.getElementById('createProfilePageId'),
            manageProfilesView: document.getElementById('manageProfilesPageId'),
            containersListView: document.getElementById('containersListPageId'),
            informationPageView: document.getElementById('informationPageId'),
            historyPageView: document.getElementById('historyPageId')
        };

        attachEventListeners(); 
        await populateContainerList(popupContainerList, containersListView, manageContainerList);
        initManageViewListeners();
        handleGoToView("mainView")


    } catch (error) {
      console.error('Error during initialization:', error);
    }
}


// Initialize the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
}


export {initialGroupStates, views, openInSelectedProfile};
