(function(){
	function reSize(){
		//1360px下的字体大小
		var font_size12=$("#layout").width()*0.0088;
		$(".fontsize-12").css("font-size",font_size12+"px");
		var font_size14=$("#layout").width()*0.0102;
		$(".fontsize-14").css("font-size",font_size14+"px");
		var font_size15=$("#layout").width()*0.0110;
		$(".fontsize-15").css("font-size",font_size15+"px");
		var font_size16=$("#layout").width()*0.0117;
		$(".fontsize-16").css("font-size",font_size16+"px");
		var font_size18=$("#layout").width()*0.0132;
		$(".fontsize-18").css("font-size",font_size18+"px");
		var font_size20=$("#layout").width()*0.0147;
		$(".fontsize-20").css("font-size",font_size20+"px");
		var font_size22=$("#layout").width()*0.0161;
		$(".fontsize-22").css("font-size",font_size22+"px");
		var font_size24=$("#layout").width()*0.0176;
		$(".fontsize-24").css("font-size",font_size24+"px");
		var font_size26=$("#layout").width()*0.0191;
		$(".fontsize-26").css("font-size",font_size26+"px");
		var font_size28=$("#layout").width()*0.0205;
		$(".fontsize-28").css("font-size",font_size28+"px");
		var font_size30=$("#layout").width()*0.0220;
		$(".fontsize-30").css("font-size",font_size30+"px");
		var font_size32=$("#layout").width()*0.0235;
		$(".fontsize-32").css("font-size",font_size32+"px");
		var font_size36=$("#layout").width()*0.0264;
		$(".fontsize-36").css("font-size",font_size36+"px");
		var font_size40=$("#layout").width()*0.0294;
		$(".fontsize-40").css("font-size",font_size40+"px");
		var font_size70=$("#layout").width()*0.0514;
		$(".fontsize-70").css("font-size",font_size70+"px");
	}
	$(document).ready(reSize);
	$(window).resize(reSize)
})();