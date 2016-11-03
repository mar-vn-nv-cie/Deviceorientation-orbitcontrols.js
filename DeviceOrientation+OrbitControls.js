//DeviceOrientation+OrbitControls.js
//Created by OrbitControls.js and DeviceOrientationControls.js
//@author mar_vn_nv_cie / https://github.com/mar-vn-nv-cie

//OrbitControls
/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe

//DeviceOrientationControls
/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */


THREE.OrbitControls = function ( object, domElement ) {
    
    this.object = object;
    
    this.domElement = ( domElement !== undefined ) ? domElement : document;
    
    // Set to false to disable this control
    this.enabled = true;
    this.dampingEnded=true;//added
    this.minDelta=0.002;//added
    
    // "target" sets the location of focus, where the object orbits around
 //   this.target = new THREE.Vector3();
//    this.rotating=false;
    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = 0;
    this.maxDistance = Infinity;
    
    
    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = 0;
    this.maxZoom = Infinity;
    
    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = -Math.PI/2; // radians
    this.maxPolarAngle = Math.PI/2; // radians
    this.switched = false;

    this.minAzimuthAngle = - Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians
    
    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = false;
    this.dampingFactor = 0.25;
    
    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = true;
    this.zoomSpeed = 0.75;
    
    // Set to false to disable rotating
    this.enableRotate = true;
    this.rotateSpeed = 1.0;
    
    // Set to false to disable panning
    this.enablePan = false;
    this.keyPanSpeed = 7.0;	// pixels moved per arrow key push
    
    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60
    
    // Set to false to disable use of the keys
    this.enableKeys = true;
    
    // The four arrow keys
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
    
    // Mouse buttons
    this.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT };
    
    this.zoom0 = this.object.zoom;
    
    //
    // internals
    //
    
    var scope = this,
    changeEvent = { type: 'change' },
    startEvent = { type: 'start' },
    endEvent = { type: 'end' },
    STATE = { NONE : - 1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 },    
    state = STATE.NONE,
    scale = 1,
    zoomChanged = false;

    //    var panOffset = new THREE.Vector3();
    
//    var EPS = 0.000001;
    
    // current position in spherical coordinates
    var spherical = new THREE.Spherical();
    var sphericalDelta = new THREE.Spherical();
    var rotateStart = new THREE.Vector2();
    var rotateEnd = new THREE.Vector2();
    var rotateDelta = new THREE.Vector2();
    /*  
     var panStart = new THREE.Vector2();
     var panEnd = new THREE.Vector2();
     var panDelta = new THREE.Vector2();
     */
    var dollyStart = new THREE.Vector2();
    var dollyEnd = new THREE.Vector2();
    var dollyDelta = new THREE.Vector2();

    
    
    //
    // public methods
    //
    
    this.getPolarAngle = function () {
        
        return spherical.phi;
        
    };
    
    this.getAzimuthalAngle = function () {
        
        return spherical.theta;
        
    };
    
    this.reset = function () {
        
        scope.object.zoom = scope.zoom0;
        
        scope.object.updateProjectionMatrix();
        scope.dispatchEvent( changeEvent );
        
        scope.update();
        
        state = STATE.NONE;
        
    };
    
    this.update = function() {
        var lastQuaternion = new THREE.Quaternion();
	   	var currentQuaternion = new THREE.Quaternion();
		var diffQuaternion = new THREE.Quaternion();
        var rotation = new THREE.Euler( 0, 0, 0, 'YXZ' );
        var q = new THREE.Quaternion();
        var axis_x = new THREE.Vector3(1,0,0);
        var axis_y = new THREE.Vector3(0,1,0);
        
        
        return function update () {

			//Deactivate device orientation controls while damping
            scope.dampingEnded=Math.abs(sphericalDelta.theta)+Math.abs(sphericalDelta.phi)<scope.minDelta;
            if(state == STATE.NONE && scope.dampingEnded)
                return;
            if(scope.switched){
				rotation.setFromQuaternion( scope.object.quaternion, 'YXZ' );
				spherical.phi = rotation.x;
				spherical.theta = rotation.y;
				
                scope.switched=false;
            }
			
			lastQuaternion.setFromAxisAngle(axis_y, spherical.theta);
            lastQuaternion.multiply(q.setFromAxisAngle(axis_x, spherical.phi));
			
			
			spherical.phi += sphericalDelta.phi;
			spherical.theta += sphericalDelta.theta;

			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );
			spherical.radius *= scale;
			spherical.radius = Math.min( scope.maxDistance, spherical.radius );

			currentQuaternion.setFromAxisAngle(axis_y, spherical.theta);
            currentQuaternion.multiply(q.setFromAxisAngle(axis_x, spherical.phi));

			
            diffQuaternion = lastQuaternion.inverse().multiply(currentQuaternion);
			
			scope.object.quaternion.multiply(diffQuaternion);
			

			if ( !scope.dampingEnded ) {                
                sphericalDelta.theta *= ( 1 - scope.dampingFactor );
                sphericalDelta.phi *= ( 1 - scope.dampingFactor ); 
            } else
                sphericalDelta.set( 0, 0, 0 );
            
            return false;            
        };
        
    }();
    
    
    this.lastOrientation=[0,0,0,0];
    
    this.tilt=function(){
        var currentOrientation = [];
		var deg2rad = Math.PI/180;
        var deviceQuaternion=new THREE.Quaternion();
        var lastQuaternion = new THREE.Quaternion();
        var diffQuaternion = new THREE.Quaternion();
        return function(){
            if(state==STATE.NONE && scope.dampingEnded){
                currentOrientation = [
                     event.alpha? event.alpha * deg2rad : 0,
                     event.beta? event.beta * deg2rad : 0,
					 event.gamma? event.gamma * deg2rad : 0,
                     scope.screenOrientation?scope.screenOrientation * deg2rad : 0
                ];
                if(scope.lastOrientation == null)//When switched from orbit
                    scope.lastOrientation = currentOrientation;
                setObjectQuaternion(deviceQuaternion, currentOrientation);
                setObjectQuaternion(lastQuaternion, scope.lastOrientation);
                diffQuaternion = lastQuaternion.inverse().multiply(deviceQuaternion);//add differences of the current/last orientation
                scope.object.quaternion.multiply(diffQuaternion);
				scope.lastOrientation = currentOrientation;
            };}}();
    
    var onScreenOrientationChangeEvent = function() {
        scope.screenOrientation = window.orientation || 0;
    };
    onScreenOrientationChangeEvent();
    var resetOrientation = function(){
        scope.lastOrientation = null;
    };
    
    window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);

    
    
    this.dispose = function() {
        
        scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false );
        scope.domElement.removeEventListener( 'mousedown', onMouseDown, false );
        scope.domElement.removeEventListener( 'wheel', onMouseWheel, false );
        
        scope.domElement.removeEventListener( 'touchstart', onTouchStart, false );
        scope.domElement.removeEventListener( 'touchend', onTouchEnd, false );
        scope.domElement.removeEventListener( 'touchmove', onTouchMove, false );
        
        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mouseup', onMouseUp, false );
        
        //window.removeEventListener( 'keydown', onKeyDown, false );
        document.removeEventListener('mouseup',resetOrientation,false);
        document.removeEventListener('touchend',resetOrientation,false);window.removeEventListener('orientationchange', onScreenOrientationChangeEvent, false);window.removeEventListener('deviceorientation', this.tilt, false);
        
    };
    
    /*
    function getAutoRotationAngle() {
        
        return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
        
    }
    */
    function getZoomScale() {
        
        return Math.pow( 0.95, scope.zoomSpeed );
        
    }
    
    function rotateLeft( angle ) {
        
        sphericalDelta.theta -= angle;
        
    }
    
    function rotateUp( angle ) {
        sphericalDelta.phi -= angle;
        
    }
/*    
    var panLeft = function() {
        
        var v = new THREE.Vector3();
        
        return function panLeft( distance, objectMatrix ) {
            
            v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
            v.multiplyScalar( - distance );
            
            panOffset.add( v );
            
        };
        
    }();
    
    var panUp = function() {
        
        var v = new THREE.Vector3();
        
        return function panUp( distance, objectMatrix ) {
            
            v.setFromMatrixColumn( objectMatrix, 1 ); // get Y column of objectMatrix
            v.multiplyScalar( distance );
            
            panOffset.add( v );
            
        };
        
    }();
  */  
    // deltaX and deltaY are in pixels; right and down are positive
    /*
    var pan = function() {
        
        var offset = new THREE.Vector3();
        
        return function pan ( deltaX, deltaY ) {
            
            var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
            
            if ( scope.object instanceof THREE.PerspectiveCamera ) {
                
                // perspective
                var position = scope.object.position;
                offset.copy( position ).sub( scope.target );
                var targetDistance = offset.length();
                
                // half of the fov is center to top of screen
                targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );
                
                // we actually don't use screenWidth, since perspective camera is fixed to screen height
                panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
                panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );
                
            } else if ( scope.object instanceof THREE.OrthographicCamera ) {
                
                // orthographic
                panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
                panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );
                
            } else {
                
                // camera neither orthographic nor perspective
                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
                scope.enablePan = false;
                
            }
            
        };
        
    }();*/
    this.dollyIn=function(dollyScale){scale/=dollyScale;scope.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom*dollyScale));scope.object.updateProjectionMatrix();zoomChanged=true;};
    this.dollyOut=function(dollyScale){scale*=dollyScale;scope.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/dollyScale));scope.object.updateProjectionMatrix();zoomChanged=true;};
    
    //
    // event callbacks - update the object state
    //
    
    function handleMouseDownRotate( event ) {
        
        rotateStart.set( event.clientX, event.clientY );
        
    }
    
    function handleMouseDownDolly( event ) {
        
        dollyStart.set( event.clientX, event.clientY );
        
    }
    /*
    function handleMouseDownPan( event ) {
        
        //console.log( 'handleMouseDownPan' );
        
        panStart.set( event.clientX, event.clientY );
        
    }
    */
    function handleMouseMoveRotate( event ) {
        
        //console.log( 'handleMouseMoveRotate' );
        
        rotateEnd.set( event.clientX, event.clientY );
        rotateDelta.subVectors( rotateEnd, rotateStart );
        
        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
        
        // rotating across whole screen goes 360 degrees around
        rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * (scope.rotateSpeed * scope.dampingFactor) );
        
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        rotateUp( Math.PI * rotateDelta.y / element.clientHeight * (scope.rotateSpeed * scope.dampingFactor));
//        console.log(rotateDelta.y, element.clientHeight);
        rotateStart.copy( rotateEnd );
        
        scope.update();
        
    }
    
    function handleMouseMoveDolly( event ) {
        
        //console.log( 'handleMouseMoveDolly' );
        
        dollyEnd.set( event.clientX, event.clientY );
        
        dollyDelta.subVectors( dollyEnd, dollyStart );
        
        if ( dollyDelta.y > 0 ) {
            
            scope.dollyIn( getZoomScale() );
            
        } else if ( dollyDelta.y < 0 ) {
            
            scope.dollyOut( getZoomScale() );
            
        }
        
        dollyStart.copy( dollyEnd );
        
        scope.update();
        
    }
    /*
    function handleMouseMovePan( event ) {
        
        //console.log( 'handleMouseMovePan' );
        
        panEnd.set( event.clientX, event.clientY );
        
        panDelta.subVectors( panEnd, panStart );
        
        pan( panDelta.x, panDelta.y );
        
        panStart.copy( panEnd );
        
        scope.update();
        
    }*/
    
    
    function handleMouseWheel( event ) {
        
        //console.log( 'handleMouseWheel' );
        
        if ( event.deltaY < 0 ) {
            
            scope.dollyOut( getZoomScale() );
            
        } else if ( event.deltaY > 0 ) {
            
            scope.dollyIn( getZoomScale() );
            
        }
        
        scope.update();
        
    }
    
    
    function handleTouchStartRotate( event ) {
        
        //console.log( 'handleTouchStartRotate' );
        
        rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        
    }
    
    function handleTouchStartDolly( event ) {
        
        //console.log( 'handleTouchStartDolly' );
        
        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
        
        var distance = Math.sqrt( dx * dx + dy * dy );
        
        dollyStart.set( 0, distance );
        
    }
    /*
    function handleTouchStartPan( event ) {
        
        //console.log( 'handleTouchStartPan' );
        
//        panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        
    }
    */
    function handleTouchMoveRotate( event ) {
        
        //console.log( 'handleTouchMoveRotate' );
        
        rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        rotateDelta.subVectors( rotateEnd, rotateStart );
        
        var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
        
        // rotating across whole screen goes 360 degrees around
        rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * (scope.rotateSpeed * scope.dampingFactor));
        
        // rotating up and down along whole screen attempts to go 360, but limited to 180
        rotateUp( Math.PI * rotateDelta.y / element.clientHeight * (scope.rotateSpeed * scope.dampingFactor) );
        
        rotateStart.copy( rotateEnd );
        
        scope.update();
        
    }
    
    function handleTouchMoveDolly( event ) {
        
        //console.log( 'handleTouchMoveDolly' );
        
        var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
        
        var distance = Math.sqrt( dx * dx + dy * dy );
        
        dollyEnd.set( 0, distance );
        
        dollyDelta.subVectors( dollyEnd, dollyStart );
        
        if ( dollyDelta.y > 0 ) {
            
            scope.dollyOut( getZoomScale() );
            
        } else if ( dollyDelta.y < 0 ) {
            
            scope.dollyIn( getZoomScale() );
            
        }
        
        dollyStart.copy( dollyEnd );
        
        scope.update();
        
    }
    /*
    function handleTouchMovePan( event ) {
        
        //console.log( 'handleTouchMovePan' );
        /*
        panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
        
        panDelta.subVectors( panEnd, panStart );
        
        pan( panDelta.x, panDelta.y );
        
        panStart.copy( panEnd );
        
        scope.update();
      
    }
      */
    
    //
    // event handlers - FSM: listen for events and reset state
    //
    
    function onMouseDown( event ) {
        
//        if ( scope.enabled === false ) return;
        
        event.preventDefault();
        scope.switched = true;
        
        if ( event.button === scope.mouseButtons.ORBIT ) {
            
//            if ( scope.enableRotate === false ) return;
            
            handleMouseDownRotate( event );
            
            state = STATE.ROTATE;
            
        } else if ( event.button === scope.mouseButtons.ZOOM ) {
            
  //          if ( scope.enableZoom === false ) return;
            
            handleMouseDownDolly( event );
            
            state = STATE.DOLLY;
            
        }/* else if ( event.button === scope.mouseButtons.PAN ) {
            
            if ( scope.enablePan === false ) return;
            
            handleMouseDownPan( event );
            
            state = STATE.PAN;
            
        }
        */
        if ( state !== STATE.NONE ) {
            
            document.addEventListener( 'mousemove', onMouseMove, false );
            document.addEventListener( 'mouseup', onMouseUp, false );
            
            scope.dispatchEvent( startEvent );
            
        }
        
    }
    
    function onMouseMove( event ) {
        
//        if ( scope.enabled === false ) return;
        
        event.preventDefault();
        
        if ( state === STATE.ROTATE ) {
            
            //if ( scope.enableRotate === false ) return;
            
            handleMouseMoveRotate( event );
            
        } else if ( state === STATE.DOLLY ) {
            
//            if ( scope.enableZoom === false ) return;
            
            handleMouseMoveDolly( event );
            
        }/* else if ( state === STATE.PAN ) {
            
            if ( scope.enablePan === false ) return;
            
            handleMouseMovePan( event );
            
        }*/
        
    }
    
    function onMouseUp( event ) {
        
//        if ( scope.enabled === false ) return;
        
        //handleMouseUp( event );
        
        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'mouseup', onMouseUp, false );
        
        scope.dispatchEvent( endEvent );
        
        state = STATE.NONE;
        
    }
    
    function onMouseWheel( event ) {
        
        if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        handleMouseWheel( event );
        
        scope.dispatchEvent( startEvent ); // not sure why these are here...
        scope.dispatchEvent( endEvent );
        
    }
/*    
    function onKeyDown( event ) {
        
        if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return;
        
        handleKeyDown( event );
        
    }
 */   
    function onTouchStart( event ) {
        
        //if ( scope.enabled === false ) return;
        scope.switched = true;

        switch ( event.touches.length ) {
                
            case 1:	// one-fingered touch: rotate
                
          //      if ( scope.enableRotate === false ) return;
                
                handleTouchStartRotate( event );
                
                state = STATE.TOUCH_ROTATE;
                
                break;
                
            case 2:	// two-fingered touch: dolly
                
                if ( scope.enableZoom === false ) return;
                
                handleTouchStartDolly( event );
                
                state = STATE.TOUCH_DOLLY;
                
                break;
                /*
            case 3: // three-fingered touch: pan
                
                if ( scope.enablePan === false ) return;
                
                handleTouchStartPan( event );
                
                state = STATE.TOUCH_PAN;
                
                break;
                */
            default:
                
                state = STATE.NONE;
                
        }
        
        if ( state !== STATE.NONE ) {
            
            scope.dispatchEvent( startEvent );
            
        }
        
    }
    
    function onTouchMove( event ) {
        
        if ( scope.enabled === false ) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        switch ( event.touches.length ) {
                
            case 1: // one-fingered touch: rotate
                
                //if ( scope.enableRotate === false ) return;
                if ( state !== STATE.TOUCH_ROTATE ) return;
                
                handleTouchMoveRotate( event );
                
                break;
                
            case 2: // two-fingered touch: dolly
                
      //          if ( scope.enableZoom === false ) return;
                if ( state !== STATE.TOUCH_DOLLY ) return; // is this needed?...
                
                handleTouchMoveDolly( event );
                
                break;
                /*
            case 3: // three-fingered touch: pan
                
                if ( scope.enablePan === false ) return;
                if ( state !== STATE.TOUCH_PAN ) return; // is this needed?...
                
                handleTouchMovePan( event );
                
                break;
                */
            default:
                
                state = STATE.NONE;
                
        }
        
    }
    
    function onTouchEnd( event ) {
        
        //if ( scope.enabled === false ) return;
        
//        handleTouchEnd( event );
        
        scope.dispatchEvent( endEvent );
        
        state = STATE.NONE;
        
    }
    
    function onContextMenu( event ) {
        
        event.preventDefault();
        
    }
    
    //
    
    
    
    scope.domElement.addEventListener( 'contextmenu', onContextMenu, false );
    
    scope.domElement.addEventListener( 'mousedown', onMouseDown, false );
    scope.domElement.addEventListener( 'wheel', onMouseWheel, false );
    
    scope.domElement.addEventListener( 'touchstart', onTouchStart, false );
    scope.domElement.addEventListener( 'touchend', onTouchEnd, false );
    scope.domElement.addEventListener( 'touchmove', onTouchMove, false );
    
//    window.addEventListener( 'keydown', onKeyDown, false );
    
    this.activateDeviceOrientation = function(activate){
        
        
        
        if  ( window.DeviceOrientationEvent ) {
            if(activate){
                resetOrientation();
                window.removeEventListener('deviceorientation', this.tilt, false);
                window.addEventListener('deviceorientation', this.tilt, false);
                document.removeEventListener('mouseup',resetOrientation,false);
                document.removeEventListener('touchend',resetOrientation,false);
                document.addEventListener('mouseup',resetOrientation,false);
                document.addEventListener('touchend',resetOrientation,false);

            }else{
                window.removeEventListener('deviceorientation', this.tilt, false);
                document.removeEventListener('mouseup',resetOrientation,false);
                document.removeEventListener('touchend',resetOrientation,false);
            }
        }
    };
    var setObjectQuaternion = function () {
        var zee = new THREE.Vector3( 0, 0, 1 );
        var euler = new THREE.Euler();
        var q0 = new THREE.Quaternion();
        var q1 = new THREE.Quaternion(  - Math.sqrt( 0.5 ), 0, 0,  Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis
        return function ( quaternion, orient ) {
            euler.set( orient[1], orient[0], - orient[2], 'YXZ' );
            quaternion.setFromEuler( euler );
            quaternion.multiply( q1 );
            quaternion.multiply( q0.setFromAxisAngle( zee, - orient[3] ) );
        }
    }();
    this.update();
};

THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;
