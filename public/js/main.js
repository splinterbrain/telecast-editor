window.TELECAST = window.TELECAST || {};

TELECAST.onYoutubeChange = function(e){
	var url = $("#youTube-url").val();
	//This set of characters may change in the future, YouTube makes no promises
	//TODO: Allow shortened YouTube urls, /v/VIDEO_ID, etc.
	var result = /v=([A-Za-z0-9_\-]+)/.exec(url);
	if(!result || result.length < 2){
		$("#youTube-video-id").val("???");
		return;
	}
	var videoId = result[1];
	if(videoId == $("#youTube-video-id").val()) return; //Exit if it hasn't changed
	$("#youTube-video-id").val(videoId);

	//Replace video
	$("#editor-wrapper").empty();
	$("#editor-wrapper").html('<iframe id="ytplayer" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/' + videoId +'?enablejsapi=1" frameborder="0" allowfullscreen>');
	$("#editor-wrapper").show(); //In case it's the first use

	//If the YouTube library hasn't loaded yet then the onYouTubeIframeAPIReady will catch this construction
	if(YT) TELECAST.youTubePlayer = new YT.Player('ytplayer');
}

$(function(){
	$("#youTube-url").on("change", TELECAST.onYoutubeChange);
	$("#youTube-url").on("keyup", TELECAST.onYoutubeChange);
	//Run the change event in case the user has set a value before this executes
	TELECAST.onYoutubeChange();
});

//Youtube Methods

function onYouTubeIframeAPIReady(e){
	console.log("Ready!");
	//Set YouTube player to the iframe, if it exists
	TELECAST.youTubePlayer = new YT.Player('ytplayer');
}
