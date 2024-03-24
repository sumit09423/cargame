/* 
THREE.js r101 
*/

/* Game start:
- Enters link
- Choose difficulty 
- Loading..
- On finished loading (Game_UI.js)
- Camera Starting Animation
- resetGame() (Game_UI.js)
- startCountdown() (Game_UI.js)
- start the race (Game_UI.js)
*/

function init() {
	// Renderer
	renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	if(shadows){ 
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		renderer.shadowMap.autoUpdate = false;
	}
	renderer.physicallyCorrectLights = true;
	info.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
	renderer.gammaOutput = true;
	renderer.gammaFactor = 2.2;
	
	// Scene
	scene0 = new THREE.Scene();
	
	// Cameras
	camera0 = new THREE.PerspectiveCamera( 60, canvas.width / canvas.height, 0.1, 1000 );
	camera0.name = 'camera0';
	finishCamera = new THREE.PerspectiveCamera( 60, canvas.width / canvas.height, 0.1, 1000 );
	finishCamera.position.set( 125 , 7 , -100 );
	finishCamera.lookAt( new THREE.Vector3( 105 , 0 , -120 ) );
	openingCamera = new THREE.PerspectiveCamera( 60, canvas.width / canvas.height, 0.1, 1000 );
	primaryCamera = openingCamera;
	
	// Clock
	clock = new THREE.Clock();
	
	//Stats
	stats = new Stats();
	document.body.appendChild( stats.dom );
	
	// Loaders
	textureLoader = new THREE.TextureLoader();
	cubeTextureLoader = new THREE.CubeTextureLoader();
	gltfLoader = new THREE.GLTFLoader();
	THREE.DefaultLoadingManager.onLoad = function(){
		setTimeout( function(){
			finishLoading();
		}, 1000 );
	}
	THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
		loadingBar.style.width = (itemsLoaded/itemsTotal * 100) + '%';
	};

	// Resize Event
	window.addEventListener("resize", function(){
		renderer.setSize( window.innerWidth, window.innerHeight );
		camera0.aspect = window.innerWidth / window.innerHeight;
		camera0.updateProjectionMatrix();
		finishCamera.aspect = window.innerWidth / window.innerHeight;
		finishCamera.updateProjectionMatrix();
		openingCamera.aspect = window.innerWidth / window.innerHeight;
		openingCamera.updateProjectionMatrix();
	}, false);
	
	// Inits
	initControls();
	initTextures();
	
	initTrackEmitter();
	loadModels();
	initLights();
}

let initTrackEmitter = function(){
	
	pointsMat = new THREE.PointsMaterial({
		color: 0x150703,
		transparent: true,
		opacity: 0.2,
		size: 0.7,
	});
	
	pointsGeo = new THREE.BufferGeometry();
	posArr = [];
	let x = 0;
	let y = 0;
	let z = 0;
	const numOfParticles = 400;
	for( let i = 0; i < numOfParticles; i++ ){
		posArr.push( x , y , z );
	}
	pointsGeo.addAttribute( 'position', new THREE.Float32BufferAttribute( posArr , 3 ) );
	
	trackEmitter = new THREE.Points( pointsGeo , pointsMat );
	scene0.add( trackEmitter );
	
	trackEmitter.renderOrder = 1;
	trackEmitter.frustumCulled = false;
	trackEmitter.timer = 0;
	trackEmitter.numOfVerts = numOfParticles;
	trackEmitter.vertIndex = 0;
	trackEmitter.extraVec = new THREE.Vector3();
	const size = 6;
	trackEmitter.update = function(){
		
		let pos = trackEmitter.geometry.attributes.position;
		
		let wheelPos = car2.wheels[0].getWorldPosition(trackEmitter.extraVec);
		pos.array[ trackEmitter.vertIndex*size ] = wheelPos.x;
		pos.array[ trackEmitter.vertIndex*size +1 ] = wheelPos.y - 0.37;
		pos.array[ trackEmitter.vertIndex*size +2 ] = wheelPos.z;
		
		wheelPos = car2.wheels[1].getWorldPosition(trackEmitter.extraVec);
		pos.array[ trackEmitter.vertIndex*size +3] = wheelPos.x;
		pos.array[ trackEmitter.vertIndex*size +4 ] = wheelPos.y - 0.37;
		pos.array[ trackEmitter.vertIndex*size +5 ] = wheelPos.z;
		
		pos.needsUpdate = true;
		trackEmitter.vertIndex++;
		if( trackEmitter.vertIndex * size >= trackEmitter.numOfVerts - size ) 
			trackEmitter.vertIndex = 0;
	}
}

let loadModels = function(){
	
	gltfLoader.load( 'assets/models/grass-track.glb', function( gltf ){
		
		// Create animated waving flag material
		let flagMat = new THREE.MeshPhongMaterial({ 
			color: 0xe01010,
			shininess: 0,
			side: THREE.DoubleSide,
		});
		flagMat.onBeforeCompile = function( shader ){
			shader.uniforms.uTime = { value: 0.0 };
			shader.vertexShader = `
				uniform float uTime;
			` + shader.vertexShader;
			const token = `#include <begin_vertex>`;
			const customTransform = `
				vec3 transformed = vec3(position);
				float freq = 3.0;
				float amp = 0.5;
				float angle = ( uTime + position.z ) * freq;
				transformed.x += sin( angle )* amp * position.z/2.0;
				objectNormal = normalize(vec3(-amp * freq * cos(angle)*0.2,0.0,1.0));
				vNormal = normalMatrix * objectNormal;
			`
			shader.vertexShader =
				shader.vertexShader.replace(token,customTransform);
			flagShader = shader;
		}
		let toRemove = [];
		
		gltf.scene.traverse( function( node ){
			
			// Correct ground letters materials
			if( node.name.includes('FINISH') || node.name.includes('START') || node.name.includes('Flowers') ){
				node.material.transparent = true;
				node.material.map.anisotropy = info.maxAnisotropy;
				node.renderOrder = 1; // to help transparency blending in three
			}
			
			// Apply wind animation shader to flag material
			if( node.name.includes('Flag') && !node.name.includes('Flag-Pole') ){
				node.material = flagMat;
			}
			
			// Material Adjustments
			if( node.name.includes('Plant') ){
				node.material.side = THREE.DoubleSide;
			}
			
			if( node.name.includes('Track') ||
				node.name.includes('Finish_Line') || 
				node.name.includes('Start_Line') ){
					
				node.receiveShadow = true;
				node.castShadow = false;
			}
			
			// Remove Placeholder Cars
			if( node.name.includes('Car-Placeholder') ){
				toRemove.push( node );
			}
			
		} );
		
		toRemove.forEach( function(object){
			gltf.scene.remove( object );
		});
		
		// Add light wavy grass animation
		let grass = gltf.scene.getObjectByName('Grass');
		grass.material.onBeforeCompile = function( shader ){
			shader.uniforms.uTime = { value: 0.0 };
			shader.vertexShader = `
				varying vec3 pos;
			` + shader.vertexShader;
			shader.vertexShader =
				shader.vertexShader.replace( `#include <begin_vertex>` , 
				`pos = position;
				#include <begin_vertex>` );
				
			shader.fragmentShader = `
				uniform float uTime;
				varying vec3 pos;
			` + shader.fragmentShader;
			const token = `gl_FragColor = vec4( outgoingLight, diffuseColor.a );`;
			const customColor = `
				float windVal = (sin( (pos.z + uTime) * 0.1 ) * 0.117) - 0.1;
				windVal = max( windVal , 0.0 );
				outgoingLight += vec3( windVal );
				gl_FragColor = vec4( outgoingLight, diffuseColor.a );
			`
			shader.fragmentShader =
				shader.fragmentShader.replace( token , customColor );
			grassShader = shader;
		}
		
		// Adjust Occlusion Map intensity
		let dirtTrack = gltf.scene.getObjectByName('Track');
		dirtTrack.material.aoMapIntensity = 10;
		grass.material.aoMapIntensity = 10;
		
		let finishTower = gltf.scene.getObjectByName('Finish_Tower');
		finishTower.traverse( function(node){
			if( node instanceof THREE.Mesh )
				node.castShadow = true;
		});
		
		// Camera Starting Animation
		openingCamera = gltf.cameras[0];
		openingCamera.fov = 60;
		openingCamera.aspect = canvas.width/canvas.height;
		openingCamera.updateProjectionMatrix();
		openingCamera.animationMixer = new THREE.AnimationMixer( openingCamera.parent );
		let camClip = THREE.AnimationClip.findByName( gltf.animations, 'Camera_Move1' );
		openingCamera.animations = { 
			startingShow: openingCamera.animationMixer.clipAction( camClip ), 
		};
		openingCamera.animations.startingShow.timeScale = 0.5;
		openingCamera.animations.startingShow.loop = THREE.LoopOnce;
		
		// LOAD THE CARS
		loadCar2( gltf.animations );

		scene0.add( gltf.scene );
		if( shadows ) renderer.shadowMap.needsUpdate = true;
	} );
	
}

let loadCar2 = function( animations ){
	
	gltfLoader.load( 'assets/models/car.glb', function( gltf ){
		
		car2 = gltf.scene.children[0];
		car2.wheels = [];
		
		gltf.scene.traverse( function( node ){
			
			// Shadows setup
			if( shadows && node instanceof THREE.Mesh ){
				node.castShadow = true;
			}
			
			// Setup the environment map as it doesnt get exported with blender
			if( node.material ){
				node.material.setValues({
					envMap: Textures.skyBox,
				});
			}
			
			if( node.material && ( node.material.name.includes('Lacquer_Mat') || node.material.name.includes('Glass_Mat') || node.material.name.includes('Silver_Mat') || node.material.name.includes('Tire_Mat') ) ){
				node.material.setValues({
					side: THREE.DoubleSide,
				});
			}
			
			// Make glass material transparent as it doesnt get exported in blender
			if( node.material && node.material.name === 'Glass_Mat' ){
				node.renderOrder = 0.5; // to help transparency blending in three
				node.material.setValues({
					transparent: true,
					opacity: 0.5,
				});
			}
			
			// Add wheels to the array
			if( node.name.includes('_Wheel_') ){
				car2.wheels.push( node );
			}
			
		} );
		
		car2.shadow = car2.getObjectByName( 'shadow' );
		car2.shadow.position.y += 0.08;
		car2.shadow.material = new THREE.MeshLambertMaterial({
			alphaMap: car2.shadow.material.map,
			map: null,
			color: new THREE.Color( 0 , 0 , 0 ),
			transparent: true,
		});
		
		loadCar1( car2, animations );
		
		car2.goal = new THREE.Object3D();
		car2.add( car2.goal );
		car2.goal.position.set( 0 , 3.5 , 5.0 );
		car2.temp = new THREE.Vector3();
		
		car2.position.set(  -100 , 0 , 105  );
		car2.finishingTime = 0;
		
		car2.animationMixer = new THREE.AnimationMixer( car2 );
		let driveClip = THREE.AnimationClip.findByName( animations, 'Car2_Drive' );
		car2.animations = { 
			drive: car2.animationMixer.clipAction( driveClip ), 
		};
		car2.animations.drive.timeScale = 0;
		car2.animations.drive.loop = THREE.LoopOnce;
		car2.animations.drive.clampWhenFinished = true;
		car2.animations.drive.play();
		car2.animationMixer.update( 1/60 ); 
		
		car2.rotateWheels = function(){
			if( this.animations.drive.paused ) return;
			for( let i=0; i<this.wheels.length; i++ ){
				this.wheels[i].rotateX( -this.animations.drive.timeScale*0.3 );
			}
		}
		
		car2.temp.setFromMatrixPosition( car2.goal.matrixWorld );
		camera0.position.lerp( car2.temp , 0.4 );
		camera0.lookAt( car2.position );

		scene0.add( car2 );
	} );
}

let loadCar1 = function( car , animations ){
	
	car1 = car.clone();
	car1.position.set(  -110 , 0 , 105  );
	car1.finishingTime = 0;
	car1.children[0].material = car.children[0].material.clone();
	car1.children[0].material.color = new THREE.Color( 0.1, 0.1, 0.15 );
	car1.wheels = [];
	car1.traverse( function( node ){
		// Add wheels to the array
		if( node.name.includes('_Wheel_') ){
			car1.wheels.push( node );
		}
		
		if( node.material && node.material.name.includes('Body_Mat') ){
			node.material = node.material.clone();
			node.material.map = Textures.enemyCharacter_COL;
		}
	} );
	
	car1.animationMixer = new THREE.AnimationMixer( car1 );
	let driveClip = THREE.AnimationClip.findByName( animations, 'Car1_Drive' );
	car1.animations = { 
		drive: car1.animationMixer.clipAction( driveClip ), 
	};
	car1.animations.drive.timeScale = 0.0;
	car1.animations.drive.loop = THREE.LoopOnce;
	car1.animations.drive.clampWhenFinished = true;
	car1.animations.drive.play();
	car1.animationMixer.update( 1/60 );
	
	car1.rotateWheels = function(){
		if( this.animations.drive.paused ) return;
		for( let i=0; i<this.wheels.length; i++ ){
			this.wheels[i].rotateX( -this.animations.drive.timeScale*0.3 );
		}
	}
	
	scene0.add( car1 );
	
	if( shadows ) updateShadowCamera();
	
}

let initControls = function(){
	gameState.correct = true;
	
	window.addEventListener( 'keypress', function(evt){
		
		if( gameState.startAnimation && !gameState.loadingAssets ) finishAnimation();

		if( gameState.loadingAssets || !gameState.typingAllowed ) return;
		
		ih = textDiv.innerHTML;
		if( evt.key === TEXT[index] ){ // success
			index++;
			if( index >= TEXT.length ) return;
			
			let token = '<span class="marked correct">';
			if( !gameState.correct ) token = '<span class="marked incorrect">';
			ih = ih.replace( token , '' );
			ih = ih.replace( '</span>' , '' );
			ih = ih.substring( 0 , index ) + '<span class="marked correct">' + ih[index] + '</span>' + ih.substring( index +1 , ih.length );
			textDiv.innerHTML = ih;
			gameState.correct = true;
			
			
			if( index >= 5 ) // start off faster
				car2.animations.drive.timeScale += CHAR_INCREMENT;
			else
				car2.animations.drive.timeScale += STARTING_BONUSES[index];
			
			checkIndexMarker();
			gameState.stats.characters++;
			
		} else { // fail
			if( gameState.correct ){
				ih = ih.replace( '<span class="marked correct">' , '<span class="marked incorrect">' );
				textDiv.innerHTML = ih;
				gameState.correct = false;
				if( car2.animations.drive.timeScale > MINIMUM_SPEED )
					car2.animations.drive.timeScale -= MISTAKE_DECREMENT;
			}
			gameState.stats.mistakes++;
		}
		
	}, false );
}

let initTextures = function(){
	
	// Skybox cubemap
	let name = 'sky';
	let format = '.jpg';
	cubeTextureLoader.setPath( 'assets/img/' + name + '/' );
	Textures.skyBox = cubeTextureLoader.load( [
		'px' + format, 'nx' + format,
		'py' + format, 'ny' + format,
		'pz' + format, 'nz' + format 
	], 
	function(){
		scene0.background = Textures.skyBox;
	} );
	
	Textures.enemyCharacter_COL = textureLoader.load('assets/img/Enemy_Character_COL.jpg');
	Textures.enemyCharacter_COL.flipY = false;
}

let initLights = function(){
	lightCamRange = 30;
	
	Lights[0] = new THREE.HemisphereLight( 
		0xffffff,
		0xa0a0a0,
		1.0 
	);
	Lights[0].position.set( 0 , 10 , 0 );
	Lights[1] = new THREE.DirectionalLight( 0xffffd0 , 3.5 );
	Lights[1].position.set( 100 , 130 , -40 );
	if(shadows){
		Lights[1].castShadow = true;
		Lights[1].shadow.mapSize.width = 1024 * 1;
		Lights[1].shadow.mapSize.height = 1024 * 1;
		Lights[1].shadow.camera.near = 0.1;
		Lights[1].shadow.camera.far = 1000;
		if( Lights[1] instanceof THREE.DirectionalLight ){
			Lights[1].shadow.camera.left = -lightCamRange;
			Lights[1].shadow.camera.bottom = -lightCamRange;
			Lights[1].shadow.camera.top = lightCamRange;
			Lights[1].shadow.camera.right = lightCamRange;
		}
		Lights[1].shadow.bias = 0.0002;
	}
	
	Lights[2] = new THREE.DirectionalLight( 0xffffd0 , 3.0 );
	Lights[2].position.set( -130 , 130 , 30 );
	
	for(let i = 0; i < Lights.length; i++){
		scene0.add( Lights[i] );
	}
}

let updateShadowCamera = function(){
	
	Lights[1].target = car2;
	Lights[1].position.set( 
		100 + car2.position.x , 
		100 , 
		-40 + car2.position.z ,
	);
	renderer.shadowMap.needsUpdate = true;
}

function animate() {
	
	stats.begin();
	let delta = clock.getDelta();
	if( delta > 1 ) delta = 1/30;
	time += 0.1;
	if( flagShader ) 
		flagShader.uniforms.uTime.value = time/2;
	if( grassShader ) 
		grassShader.uniforms.uTime.value = time * 2.0;
	
	if( !gameState.loadingAssets ){
			
		car1.animationMixer.update( delta );
		car2.animationMixer.update( delta ); 
		if( gameState.startAnimation ) openingCamera.animationMixer.update( delta );
		
		car2.temp.setFromMatrixPosition( car2.goal.matrixWorld );
		if( gameState.START == false || car2.animations.drive.timeScale < 0.1 )
			car2.alpha = 1.2;
		else 
			car2.alpha = car2.animations.drive.timeScale * 7.5; // 1 - 3.25 (0.5 tScale)
		
		if( openingCamera.animations.startingShow.paused == true ){
			camera0.position.lerp( car2.temp , car2.alpha * delta );
			camera0.lookAt( car2.position );
		}
		
		car2.rotateWheels();
		car1.rotateWheels();
		trackEmitter.update();
		
		if( (car2.animations.drive.timeScale > MINIMUM_SPEED || !gameState.typingAllowed) && car2.animations.drive.timeScale - SPEED_FALLOFF_CONST >= 0 ){
			car2.animations.drive.timeScale *= SPEED_FALLOFF_PERCENTAGE;
			car2.animations.drive.timeScale -= SPEED_FALLOFF_CONST;
		}
		
		if( shadows ) updateShadowCamera();
	}
	
	if( gameState.START ) { 
		
		checkIfFinished();
	}
	
	renderer.render( scene0 , primaryCamera );
	
	stats.end();
	requestAnimationFrame( animate );
}
