(
    function(){
        var util = {};
        //进入全屏
        function requestFullScreen() {
            var de = document.documentElement;
            if (de.requestFullscreen) {
                de.requestFullscreen();
            } else if (de.mozRequestFullScreen) {
                de.mozRequestFullScreen();
            } else if (de.webkitRequestFullScreen) {
                de.webkitRequestFullScreen();
            }
        }
        util.requestFullScreen = requestFullScreen;
        //退出全屏
        function exitFullscreen() {
            var de = document;
            if (de.exitFullscreen) {
                de.exitFullscreen();
            } else if (de.mozCancelFullScreen) {
                de.mozCancelFullScreen();
            } else if (de.webkitCancelFullScreen) {
                de.webkitCancelFullScreen();
            }
        }

        util.exitFullscreen = exitFullscreen;


        function zipImage(src , MaximgW, MaximgH ,callback ) {
            var image = new Image();
            image.onload = function() {
                var canvas  = document.createElement('canvas');
                //if (image.width > image.height) {
                //    imageWidth = MaximgW;
                //    imageHeight = MaximgH * (image.height / image.width);
                //} else if (image.width < image.height) {
                //    imageHeight = MaximgH;
                //    imageWidth = MaximgW * (image.width / image.height);
                //} else {
                    imageWidth = MaximgW;
                    imageHeight = MaximgH;
                //}
                canvas.width = imageWidth;
                canvas.height = imageHeight;
                var con = canvas.getContext('2d');
                con.clearRect(0, 0, canvas.width, canvas.height);
                con.drawImage(image, 0, 0, imageWidth, imageHeight);
                var  base64 = canvas.toDataURL('image/jpeg', 0.5);
                callback(base64);
            };
            image.src = src;
        }
        util.zipImage = zipImage;

        function getInputFile(file) {
            var url = null;
            if (window.createObjectURL != undefined) { // basic
                url = window.createObjectURL(file);
            } else if (window.URL != undefined) { // mozilla(firefox)
                url = window.URL.createObjectURL(file);
            } else if (window.webkitURL != undefined) { // webkit or chrome
                url = window.webkitURL.createObjectURL(file);
            }
            return url;
        }
        util.getInputFile = getInputFile;


        function isEmptyObject(e) {
            var t;
            for (t in e)
                return !1;
            return !0
        }

        util.isEmptyObject = isEmptyObject;

        window.util = util;
    })
()