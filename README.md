# DeviceOrientation+OrbitControls

On the example of [OrbitControls.js](https://threejs.org/examples/misc_controls_orbit.html), the camera smoothly rotate but does not include the deviceorientation's control. When you need to control the camera with touch and deviceorientation (ex. for the mobile device's usage), [DeviceorientationControls.js](https://threejs.org/examples/misc_controls_deviceorientation.html)
 is also needed. But the DeviceorientationControls rotate the camera only based on the device's orientation, so that the camera's direction is always initialized when DeviceorientationControls is activated, unless the camera's current direction.
 For that reason, I wrote this script due to the need to link the DeviceorientationControls and OrbitControls especially for the reason of controlling the VR videos more well. ([ref. product app](https://itunes.apple.com/jp/app/vrtube-for-youtube-wan-quan/id1126650962?mt=8)) .
 
## Usage
On the default, DeviceorientationControls is inactive. So it is need to activate the deviceorientation event first. Other than that, it is almost the same as the OrbitControls.js (pan and keyboard event are commentouted by the default for vr usage). 

```
var controls = new THREE.OrbitControls( camera );
controls.activateDeviceOrientation(true);
```
