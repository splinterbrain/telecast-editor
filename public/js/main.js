window.TELECAST = window.TELECAST || {};

//Video information
TELECAST.videoId = "";
TELECAST.videoBoundaries = {start: 0, end: Number.MAX_VALUE};

//Flag for updating handles when loading URL
TELECAST.shouldUpdateHandles = false;

TELECAST.onYouTubeChange = function(e){
	var url = $("#youTube-url").val();
	//This set of characters may change in the future, YouTube makes no promises
	//TODO: Allow shortened YouTube urls, /v/VIDEO_ID, etc.
	var result = /v=([A-Za-z0-9_\-]+)/.exec(url);
	if(!result || result.length < 2){
		$("#youTube-video-id").val("???");
		return;
	}
	var videoId = result[1];	
	if(videoId == TELECAST.videoId) return; //Exit if it hasn't changed
	TELECAST.videoId = videoId;
	TELECAST.videoBoundaries = {start: 0, end: Number.MAX_VALUE};
	TELECAST.updateUrl();
	$("#youTube-video-id").val(videoId);

	//If the YouTube library hasn't loaded yet then the onYouTubeIframeAPIReady will catch this construction
	TELECAST.setYouTubePlayer();
}

TELECAST.setYouTubePlayer = function(){
	if(!TELECAST.videoId) return;
	//Replace video
	clearInterval(TELECAST.playTicker);
	$("#editor-wrapper iframe").remove();
	$("#editor-wrapper").prepend('<iframe id="ytplayer" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/' + TELECAST.videoId +'?enablejsapi=1&autoplay=1" frameborder="0" allowfullscreen>');
	$("#editor-wrapper").show(); //In case it's the first use

	//Set YouTube player to the iframe, if it exists
	if(YT && YT.Player){
		//Reset start/stop handles
		$("#start-time").css("left", ""); //Clear the draggable left setting

		TELECAST.youTubePlayer = new YT.Player('ytplayer', {
			events :{
				"onReady" : function(e){

				},
				"onStateChange" : function(e){
					if(e.data == YT.PlayerState.PLAYING){
						TELECAST.playTicker = setInterval(function(){
							if(TELECAST.youTubePlayer.getCurrentTime() > TELECAST.videoBoundaries.end){
								TELECAST.youTubePlayer.pauseVideo();
							}

							//Check if metadata ready and handles need set
							if(TELECAST.shouldUpdateHandles && TELECAST.youTubePlayer.getDuration() > 0){
								$("#start-time").css("left", Math.max(TELECAST.videoBoundaries.start/TELECAST.youTubePlayer.getDuration()*640, 0)+"px");
								$("#end-time").css("left", Math.min(TELECAST.videoBoundaries.end/TELECAST.youTubePlayer.getDuration()*640, 640)+"px");
								TELECAST.shouldUpdateHandles = false;
							}

						}, 1000);

						//There's no event for metadata being available, so we have to do this

					}else{
						clearInterval(TELECAST.playTicker);
					} 
				}
			}
		});		
	}
}

TELECAST.updateUrl = function(){
	history.pushState(null, null, "#!" + TELECAST.videoId + TELECAST.videoBoundaries.start + "," + TELECAST.videoBoundaries.end);
}

TELECAST.onPopState = function(e){
	//Parse the URL to restore hande locations
	var state = location.hash.slice(2);
	var videoId = state.slice(0,11);
	if(videoId) TELECAST.videoId = videoId;
	var boundaries = state.slice(11).split(",");
	if(boundaries && boundaries.length == 2){
		TELECAST.videoBoundaries.start = boundaries[0];
		TELECAST.videoBoundaries.end = boundaries[1];
		TELECAST.shouldUpdateHandles = true;
	}

	TELECAST.setYouTubePlayer();
}	


$(function(){

	TELECAST.onPopState();

	window.onpopstate = TELECAST.onPopState;


	//Bindings for youtube input
	$("#youTube-url").on("change", TELECAST.onYouTubeChange);
	$("#youTube-url").on("keyup", TELECAST.onYouTubeChange);

	//Run the change event in case the user has set a value before this executes
	TELECAST.onYouTubeChange();

	//Set the input field if it's empty
	if(TELECAST.videoId && $("#youTube-url").val() == ""){
		$("#youTube-url").val("http://youtube.com/watch?v=" + TELECAST.videoId);
		$("#youTube-video-id").val(TELECAST.videoId);
	} 

	//Draggable start/end handles
	//jQuery UI is super heavy, but native drag and drop is a huge messy hassle
	$("#start-time,#end-time").draggable({
		axis:"x", 
		containment: "parent", 
		start: function(e){
			TELECAST.shouldUpdateHandles = false;
		},
		drag: function(e){			

			TELECAST.videoBoundaries.start = $("#start-time").position().left/640*TELECAST.youTubePlayer.getDuration();
			TELECAST.videoBoundaries.end = $("#end-time").position().left/640*TELECAST.youTubePlayer.getDuration();

			TELECAST.updateUrl();

			TELECAST.youTubePlayer.seekTo($(this).position().left/640*TELECAST.youTubePlayer.getDuration());
		}
	});

	$("#start-time,#end-time").on("click", function(e){
			TELECAST.youTubePlayer.seekTo($(this).position().left/640*TELECAST.youTubePlayer.getDuration());
	});

});

//Youtube Methods
function onYouTubeIframeAPIReady(e){
	TELECAST.setYouTubePlayer();
}
