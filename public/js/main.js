window.TELECAST = window.TELECAST || {};

//Constants
TELECAST.videoWidth = 640;

//Video information
TELECAST.videoId = "";
TELECAST.videoBoundaries = {start: 0, end: Number.MAX_VALUE};

//Flag for updating handles when loading URL
TELECAST.shouldUpdateHandles = false;

TELECAST.onYouTubeUrlChange = function(e){
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
	
	TELECAST.setYouTubePlayer();
}

TELECAST.setYouTubePlayer = function(){
	if(!TELECAST.videoId) return;
	
	//Replace video iframe
	clearInterval(TELECAST.playTicker);
	$("#editor-wrapper iframe").remove();
	$("#editor-wrapper").prepend('<iframe id="ytplayer" type="text/html" width="' + TELECAST.videoWidth + '" height="360" src="https://www.youtube.com/embed/' + TELECAST.videoId +'?enablejsapi=1&autoplay=1&rel=0" frameborder="0" allowfullscreen>');
	$("#editor-wrapper").show(); //In case it's the first use

	//Set YouTube player to the iframe, if the YouTube library is properly loaded
	//If the YouTube library hasn't loaded yet then the onYouTubeIframeAPIReady will call this method again when it is
	if(YT && YT.Player){
		//Reset start/stop handles
		$("#start-time,#end-time").css("left", ""); //Clear the draggable left setting

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

							//There's no event for metadata being available, so we have to do this
							//Check if metadata ready and handles need set
							if(TELECAST.shouldUpdateHandles && TELECAST.youTubePlayer.getDuration() > 0){
								$("#start-time").css("left", Math.max(TELECAST.videoBoundaries.start/TELECAST.youTubePlayer.getDuration()*TELECAST.videoWidth, 0)+"px");
								$("#end-time").css("left", Math.min(TELECAST.videoBoundaries.end/TELECAST.youTubePlayer.getDuration()*TELECAST.videoWidth, TELECAST.videoWidth)+"px");
								TELECAST.youTubePlayer.seekTo(TELECAST.videoBoundaries.start);
								TELECAST.shouldUpdateHandles = false;
							}

						}, 500);


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
	//Format of the hash should be #!VIDEOIDSTART,END
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
	TELECAST.onYouTubeUrlChange();

	//Set the input field if it's empty and the URL specified one
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
			//Set start and end	
			TELECAST.videoBoundaries.start = $("#start-time").position().left/TELECAST.videoWidth*TELECAST.youTubePlayer.getDuration();
			TELECAST.videoBoundaries.end = $("#end-time").position().left/TELECAST.videoWidth*TELECAST.youTubePlayer.getDuration();

			TELECAST.updateUrl();

			//Whichever handle was moved we seek to its position
			TELECAST.youTubePlayer.seekTo($(this).position().left/TELECAST.videoWidth*TELECAST.youTubePlayer.getDuration());
		}
	});

	$("#start-time,#end-time").on("click", function(e){
		//Whichever handle was clicked we seek to its position
		TELECAST.youTubePlayer.seekTo($(this).position().left/TELECAST.videoWidth*TELECAST.youTubePlayer.getDuration());		
	});

});

//YouTube API Required Method
function onYouTubeIframeAPIReady(e){
	TELECAST.setYouTubePlayer();
}
