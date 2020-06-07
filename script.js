// AIzaSyBYewgi2GlM1aAVb-jlFc3qjtg3vLfKe8g
import 'regenerator-runtime/runtime'

const getChannelUploads = async (userId) => {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&id=${userId}&key=${process.env.API_KEY}`);
  const data = await response.json()
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

const getUploadsIds = async (userId) => {
  const videosIds = [];
  const userUploadsToken = await getChannelUploads(userId);

  await (async function getDeeperVideos(pageToken) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&${pageToken ? `pageToken=${pageToken}&` : ''
      }playlistId=${userUploadsToken}&key=${process.env.API_KEY}`)
    const data = await response.json()
    data.items.forEach(i => videosIds.push(i.contentDetails.videoId));

    if (data.nextPageToken) {
      await getDeeperVideos(data.nextPageToken)
    };
  })();

  return videosIds;
}

const getUploadLenghts = async (userId) => {
  const everyVideoId = await getUploadsIds(userId);
  const everyVideoDuration = [];

  for (let i = 0; i < everyVideoId.length; i += 50) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${everyVideoId.slice(i, i + 50).join(',')}&key=${process.env.API_KEY}`);
    const data = await response.json();
    data.items.forEach(i => everyVideoDuration.push(i.contentDetails.duration));
  }

  return everyVideoDuration;
};


const covtime = (youtube_time) => {
  const array = youtube_time.match(/(\d+)(?=[MHS])/ig) || [];
  var formatted = array.map(function (item) {
    if (item.length < 2) return '0' + item;
    return item;
  }).join(':');
  return formatted;
}

const getSecondsOfVideos = async (userId) => {
  const timeInIsoStrings = await getUploadLenghts(userId);
  const formattedTime = timeInIsoStrings.map(i => covtime(i));

  const seconds = formattedTime.reduce((total, current) => {
    let [minutes, seconds] = current.split(':');
    if (seconds) {
      seconds = parseInt(seconds) + parseInt(minutes) * 60;
    } else {
      seconds = parseInt(minutes) * 60;
    }
    total.push(seconds);
    return total;
  }, [])

  return seconds;
}

const getTotalTime = async (userId) => {
  const timeInSeconds = await getSecondsOfVideos(userId);
  const totalTime = timeInSeconds.reduce((total, current) => total + current);

  return totalTime;
}

const totalTimeToFormat = async (userId) => {
  const totalTimeInSeconds = await getTotalTime(userId);

  const hours = Math.floor(totalTimeInSeconds / 60 / 60)
  const minutes = Math.floor(totalTimeInSeconds / 60 - hours * 60)
  const seconds = Math.floor(totalTimeInSeconds % 60 % 60)
  document.querySelector('.contentTime').innerHTML = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`
}

const userIdInput = document.querySelector('.userID');
const submitBtn = document.querySelector('.submit');

submitBtn.addEventListener('click', async () => {
  document.querySelector('.contentTime').innerHTML = "just wait"
  totalTimeToFormat(userIdInput.value);
})

