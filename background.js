const youtubeURL = 'https://music.youtube.com/'

const discordURL = 'https://discord.com/channels/'

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});



chrome.action.onClicked.addListener(

  async () => {

    let retries = 0;

    if (await chrome.action.getBadgeText({}) === "OFF") {

      await chrome.action.setBadgeText({
        text: "ON"
      });

      while (true) {


        const tabsWithMusic = await chrome.tabs.query(
          {
            audible: true,
            url: `${youtubeURL}*`
          }
        )

        if (tabsWithMusic.length == 0) {
          //No music is playing, extension can't work

          const youtubeMusicTabs = await chrome.tabs.query({
            url: `${youtubeURL}*`
          })

          if (youtubeMusicTabs.length == 0) {
            //there aren't any youtube music tabs

            await chrome.tabs.create({ url: youtubeURL });

            //Accessing the properties of the loading tab
            //requires additional permissions

            //~~~~~~~~~~
            // manifest
            // 
            //"host_permissions": [
            // "https://music.youtube.com/*"
            //]

            while (true) {

              const updatedTabs = await chrome.tabs.query({
                url: `${youtubeURL}*`,
                status: "loading"
              })

              if (updatedTabs.length == 0) {
                break;
              }
              await delay(100);
            }

            const updatedTabs = await chrome.tabs.query({
              url: `${youtubeURL}*`
              //status:"complete"
            })

            //We can skip switching to the tab with the alert
            //as it automatically takes us there
            //when we create the new tab.
            await ChromeExecute(noMusicFunc, updatedTabs[0]);

            await chrome.action.setBadgeText({
              text: "OFF"
            });
            return;

          }

          else {

            if (retries < 3) {
              //in case song is changing..
              retries++;
              await delay(1000);
              continue; //uncomment when testing and change while with if
              ////HERE
              ////HERE/
              ////HERE
            }
            //there are youtube music tabs, but not audible

            await chrome.tabs.update(youtubeMusicTabs[0].id, { selected: true });
            await ChromeExecute(noMusicFunc, youtubeMusicTabs[0], youtubeMusicTabs[0]);

            await chrome.action.setBadgeText({
              text: "OFF"
            });
            return;

          }
        }
        else if (tabsWithMusic.length > 1) {
          //Can't select tab -- too many tabs with music

          await switchToTab(tabsWithMusic[0])
          await ChromeExecute(multipleMusic, tabsWithMusic[0]); //with this we don't need permission for activeTab

          await chrome.action.setBadgeText({
            text: "OFF"
          });
          return;

        }

        else {

          await delay(500);


          retries = 0;
          //There is one youtube music tab that has music playing

          // ChromeExecute(musicAlertFunc,currentTab,tabsWithMusic[0]);

          const musicQuery = await executeExperimental(getMusicMetadata, tabsWithMusic[0]);
          const musicPlaying = musicQuery[0]["result"]

          if (musicPlaying.length > 5) {


            const discordConnectedTabs = await getTabList(discordURL);



            if (discordConnectedTabs.length == 0) {


              await delay(1000);


              const discordGeneralTabs = await getTabList('https://discord.com/*')

              if (discordGeneralTabs.length == 0) {
                //no discord tabs

                await createAndWaitForPage(discordURL);

                await delay(500); //This delay is needed in order to track the /login redirect


                const discordGeneralTabsUpdated = await getTabList('https://discord.com/*');


                if (discordGeneralTabsUpdated[0].url == "https://discord.com/login") {


                  await ChromeExecute(alertWindow, discordGeneralTabsUpdated[0], "Not logged in...")
                  // switchToTab(newTab);  //when we create a new tab it auto switches to it.
                }

              }

              else {
                //discord tabs but not connected

                const discordLoginTabs = await getTabList('https://discord.com/login')

                const loginTab = discordLoginTabs[0];
                await switchToTab(loginTab);
                await ChromeExecute(alertWindow, loginTab, "Not logged in");


              }

              await chrome.action.setBadgeText({
                text: "OFF"
              });
              return;
            }

            else {

              if (await chrome.action.getBadgeText({}) === "OFF") { return; }


              //discord is connected
              const discordTab = discordConnectedTabs[0];
              await switchToTab(discordTab); //for the time being you can't keep discord as background tab and update your status. This is due to the pop up I think. when pressing edit. 

              // const username=await executeExperimental(getDiscordUsername,tabs[0]); //testing if the execute experimental works
              // switchToTab(tabs[0]);

              // await ChromeExecute(permanentPageVisibility,discordTab); Not working the way I imagined


              // const element = await executeExperimental(getElement,discordTab);
              // await ChromeExecute(alertWindow,currentTab,JSON.stringify(element))
              // await ChromeExecute(alertWindow,currentTab,"done")



              // in case there is a status box from before...
              if ( [...await executeExperimental(getElement,discordTab,'#account-set-custom-status')][0]["result"] || [...await executeExperimental(getElement,discordTab,'#account-edit-custom-status')][0]["result"]){
                
                await ChromeExecute(clickOnElement, discordTab, '[class*="title"]') //don't use aria-label selectors, as they are different for different languages..


              }

              await ChromeExecute(clickOnElement, discordTab, 'button[class*="lookFilled"]');

              await ChromeExecute(clickOnElement, discordTab, '[class*="title"]') //don't use aria-label selectors, as they are different for different languages..

              await ChromeExecute(clickOnElement, discordTab, '#account-set-custom-status')

              await ChromeExecute(clickOnElement, discordTab, '#account-edit-custom-status')

              await delay(500);

              await ChromeExecute(clickOnElement, discordTab, 'button[class*="clearButton"]');

              await ChromeExecute(clickOnElement, discordTab, '[maxlength="128"]');

              await ChromeExecute(browserWrite, discordTab, musicPlaying);

              await ChromeExecute(clickOnElement, discordTab, 'button[class*="lookFilled"]');


              for (let i=0;i<30;i++){
                await delay(1000); //update status every 10 seconds
                if (await chrome.action.getBadgeText({}) === "OFF") { return; }
              }



              ////////////////////////
              ////////////////////////
              ///
              /// Change the above to 30
              ///
              ///
              /////////////////////////
              /////////////////////////



            }






          }




        }
      }







      // const discordTabs=getTabList(discordURL);
      // await ChromeExecute(noMusicFunc,discordTabs[0]);


    }


    else {
      await chrome.action.setBadgeText({
        text: "OFF"
      });
    }



  });

// const permanentPageVisibility=()=>{
//   Object.defineProperty(window.document,'hidden',{get:function(){return false;},configurable:true});
//   Object.defineProperty(window.document,'visibilityState',{get:function(){return 'visible';},configurable:true});
//   window.document.dispatchEvent(new Event('visibilitychange'));
// }

const getElement = (query) => {
  return document.querySelector(query);
}


const getMusicMetadata = () => {

  const songTitle = document.querySelector("yt-formatted-string.title.ytmusic-player-bar").textContent;
  const imageSource = document.querySelector("img.ytmusic-player-bar").src;

  if (songTitle) {
    const songMetadata = document.querySelector("yt-formatted-string.byline.ytmusic-player-bar").textContent.split("•");
    const songArtist = songMetadata[0];
    const songAlbum = songMetadata[1];
    const songYear = songMetadata[2];

    return `Listening to ${songTitle} by ${songArtist} on Youtube Music!`;
  }

}


const browserWrite = (value) => {
  document.execCommand('insertText', false, value);
}

const changeElementValue = ({ query, value }) => {
  document.querySelector(query).value = value;
}

const clickOnElementFromList = ({ query, index }) => {
  document.querySelectorAll(query)[index].click();
}

const clickOnElement = (query) => {
  document.querySelector(query).click();
}

const executeExperimental = async (exe_Function, currentTab,argument) => {

  if (argument){
    if (currentTab) {
      return await chrome.scripting.executeScript({
        function: exe_Function,
        target: { tabId: currentTab.id },
        args:[argument]
      })
    }
  }

  if (currentTab) {
    return await chrome.scripting.executeScript({
      function: exe_Function,
      target: { tabId: currentTab.id },
    })
  }

}


// const getDiscordUsername = () => {
//   return document.querySelector('[aria-label="User area"] [class*="title"]').textContent;
// }

const alertWindow = (text) => {
  window.alert(text)
}

const testFunc = (tab) => {
  window.alert("Hello! I received this argument: " + JSON.stringify(tab.status))
}

const musicAlertFunc = (tab) => {
  window.alert("Youtube music with sound: " + JSON.stringify(tab.id))
}

const noMusicFunc = () => {
  window.alert("You are not listening to any music right now!");
}

const multipleMusic = () => {
  window.alert("There are multiple tabs that are playing music!")
}




const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const ChromeExecute = async (exe_Function, currentTab, argument) => {

  if (currentTab) {
    if (argument) {
      await chrome.scripting.executeScript({
        function: exe_Function,
        target: { tabId: currentTab.id },
        args: [argument]
      })
    }
    else {
      await chrome.scripting.executeScript({
        function: exe_Function,
        target: { tabId: currentTab.id },
      })
    }
  }

}

const getTabList = async (url) => {
  const tempTabs = chrome.tabs.query(
    {
      url: `${url}*`
    }
  )
  return tempTabs;
}

const waitUntilPageHasLoaded = async (url) => {
  while (true) {
    const updatedTabs = await chrome.tabs.query({
      url: `${url}*`,
      status: "loading"
    })
    if (updatedTabs.length == 0) {
      return await chrome.tabs.query({
        url: `${url}*`,
      });
    }
    // await delay(500);
  }
}

const createAndWaitForPage = async (url) => { //equivalent to waitUntilPageHasLoaded, but uses chrome.tabs.create() as well

  chrome.tabs.create({ url: discordURL });

  while (true) {
    const updatedTabs = await chrome.tabs.query({
      url: `${url}*`,
      status: "loading"
    })
    if (updatedTabs.length == 0) {
      return await chrome.tabs.query({
        url: `${url}*`,
      });
    }
    // await delay(500);
  }

}

const switchToTab = async (tab) => {
  if (tab) {
    await chrome.tabs.update(tab.id, { selected: true });
  }
}

const getCurrentTab = async () => {
  return [...await chrome.tabs.query({ active: true })][0]
}