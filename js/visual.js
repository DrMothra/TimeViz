/**
 * Created by atg on 14/05/2014.
 */

/*
function eliminateDuplicates(arr) {
    var i,
        len=arr.length,
        out=[],
        obj={};

    for (i=0;i<len;i++) {
        obj[arr[i]]=0;
    }
    for (i in obj) {
        out.push(i);
    }
    return out;
}
*/

function getDuplicates(arr, xAxis, yAxis) {
    //Get frequency of required members
    var dupes = [];
    for(var i=0; i<arr.length; ++i) {
        var item = arr[i];
        for(var j=0; j<arr.length; ++j) {
            if(i == j) continue;

            var currentItem = arr[j];
            if(item[xAxis] == currentItem[xAxis] &&
                    item[yAxis] == currentItem[yAxis]) {
                dupes.push(item[xAxis]);
                dupes.push(item[yAxis]);
            }
        }
    }

    if(dupes.length == 0) return null;

    //Convert array to object
    var frequency = {};
    for(var i=0; i<dupes.length; i+=2) {
        var key1 = dupes[i];
        var key2 = dupes[i+1];
        if(!(key1 in frequency)) {
            frequency[key1] = {};
            frequency[key1][key2] = 1;
        }
        else {
            ++(frequency[key1][key2]);
        }
    }

    return frequency;

    /*
    for(var i=0; i<freqs.length; ++i) {
        dupes.splice(i+2, 1, freqs[i]);
    }

    return dupes;
    */
    /*
    var counts = {};
    arr.forEach(function(element) {
        counts[element] = (counts[element] || 0) + 1;
    });

    //Construct array with duplicate + frequency
    var dupes = [];
    for(var key in counts) {
        if(counts[key] > 1) {
            dupes.push(parseInt(key));
            dupes.push(counts[key]);
        }
    }

    return dupes;
    */
}

function eliminateDuplicates(arr) {
    var r = [];
    start: for(var i = 0; i < arr.length; ++i) {
        for(var x = 0; x < r.length; ++x) {
            if(r[x]==arr[i]) {
                continue start;
            }
        }
        r[r.length] = arr[i];
    }
    return r;
}

function eliminateInvalidCells(arr) {
    //Assume invalid to be empty or undefined values
    //Assume there are NO duplicates!!!
    var out=[];

    for(var index=0; index<arr.length; ++index) {
        if(arr[index] != null && arr[index] != undefined) {
            out.push(arr[index]);
        }
    }

    return out;
}

function populatePanel(data, left, top) {
    //Fill in node panel details and display
    var element = $('#nodePanel');
    element.show();
    element.css('top', top-15);
    element.css('left', left+15);

    for(var key in data) {
        var item = document.getElementById(key);
        if (item) {
            item.innerHTML = data[key];
        }
    }
}

//Init this app from base
function VisApp() {
    BaseApp.call(this);
}

VisApp.prototype = new BaseApp();

//Render states and styles
var RENDER_NORMAL= 0, RENDER_STYLE=1;
var RENDER_CULL= 0, RENDER_COLOUR= 1, RENDER_TRANSPARENT=2;

VisApp.prototype.init = function(container) {
    BaseApp.prototype.init.call(this, container);
    this.data = null;
    this.updateRequired = false;
    this.nodesRendered = 0;
    this.spritesRendered = 0;
    this.nodesInSlider = 0;
    this.guiControls = null;
    this.dataFile = null;
    this.filename = "horror.json";
    //Always have appearance and data folders to gui
    this.guiAppear = null;
    this.guiData = null;
    //Time slider
    this.sliderPos = 0;
    //Rendering style
    this.outlineNodeName = null;
    //Camera recording
    this.camPos = [];
    this.currentCamPos = -1;
    this.mouse.clicked = true;
    //Lights
    this.lightRange = 500;
};

VisApp.prototype.update = function() {
    //Perform any updates
    var clicked = this.mouse.clicked;

    BaseApp.prototype.update.call(this);

    //Update time slider
    var slider = this.scene.getObjectByName('groupSlider');
    if(slider)
    {
        if(this.data) {
            if (this.updateRequired) {
                //Set slider position
                if(this.sliderEnabled) {
                    var pos = (this.guiControls.year - this.yearMin) / (this.yearMax - this.yearMin) * this.GROUND_DEPTH - this.GROUND_DEPTH / 2;
                    slider.position.z = pos;
                    //Alter slider width accordingly
                    var box = this.scene.getObjectByName('timeSlider', true);
                    if(box) {
                        box.scale.z = this.GROUND_DEPTH/(this.yearMax-this.yearMin) * this.guiControls.Selection;
                    }
                } else {
                    slider.position.z = 0;
                }
                this.reDraw();
                this.updateInfoPanel(this.guiControls.year, this.guiControls.Selection, this.nodesInSlider);
                this.updateRequired = false;
            }
        }
    }

    //Object selection
    if(this.pickedObjects.length > 0) {
        //DEBUG
        //console.log("Picked ", this.pickedObjects.length, "objects");
        //Show node info if selected
        var showingNode = false;
        for(var hit=0; hit<this.pickedObjects.length; ++hit) {
            var node = this.pickedObjects[hit].object.name;
            if(node.indexOf('Node') >= 0) {
                //Remove 'node'
                var name = node.substr(5, node.length-5);
                var data = this.getDataItem(name);
                if(data) {
                    populatePanel(data, this.mouseRaw.x, this.mouseRaw.y);
                    showingNode = true;
                    //Draw outline around node
                    //this.outlineNode(node);
                    break;
                }
            }
        }
        if(!showingNode) {
            $("#nodePanel").hide();
            //this.outlineNode(false);
        }
        this.pickedObjects.length = 0;
    } else {
        if(clicked) {
            $("#nodePanel").hide();
            //this.outlineNode(false);
        }
    }
};

VisApp.prototype.updateYear = function(year) {
    this.guiControls.year = parseInt(year);
    this.updateRequired = true;
};

VisApp.prototype.updateRange = function(range) {
    this.guiControls.Selection = parseInt(range);
    this.updateRequired = true;
};

VisApp.prototype.createScene = function() {
    //Init base createsScene
    BaseApp.prototype.createScene.call(this);

    var _this = this;

    this.axesGroup = new THREE.Object3D();
    this.axesGroup.name = "groupSlider";
    addAxes(this.axesGroup);
    this.GROUND_DEPTH = 480;
    this.GROUND_WIDTH = 360;
    addGroundPlane(this.scene, this.GROUND_WIDTH, this.GROUND_DEPTH);
    this.SLIDER_WIDTH = 350;
    this.SLIDER_HEIGHT = 200;
    this.SLIDER_DEPTH = 20;
    addTimeSlider(this.axesGroup, this.SLIDER_WIDTH, this.SLIDER_HEIGHT, this.SLIDER_DEPTH);
    this.scene.add(this.axesGroup);
    this.sliderEnabled = true;

    //Load json data
    var dataLoad = new dataLoader();
    var dataParser = function(data) {
        _this.data = data;
        _this.generateGUIControls();
        _this.generateData();
        _this.updateRequired = true;
    };

    dataLoad.load("data/horror.json", dataParser);

    //Light box
    var boxGeom = new THREE.BoxGeometry(2, 2, 2);
    var boxMat = new THREE.MeshBasicMaterial( {color: 0xffffff});
    var box = new THREE.Mesh(boxGeom, boxMat);
    box.name = 'lightBox';
    var light = this.scene.getObjectByName('PointLight', true);
    if(light) {
        box.position.copy(light.position);
    }

    this.scene.add(box);
};

VisApp.prototype.removeNodes = function() {
    //Remove all nodes and labels
    while(this.nodesRendered--) {
        var name;
        for(var child=0; child<this.scene.children.length; ++child) {
            name = this.scene.children[child].name;
            if(name.indexOf('Node') >= 0) {
                this.scene.remove(this.scene.children[child]);
                break;
            }
        }
    }
    this.nodesRendered = 0;

    while(this.spritesRendered--) {
        var name;
        for(var child=0; child<this.scene.children.length; ++child) {
            name = this.scene.children[child].name;
            if(name.indexOf('Sprite') >= 0) {
                this.scene.remove(this.scene.children[child]);
                break;
            }
        }
    }
    this.spritesRendered = 0;
};

VisApp.prototype.outlineNode = function(name) {
    //Generate or remove highlight around given node

    //Ensure we aren't clicking same node twice
    if(this.outlineNodeName == name +'outline') return;

    //Remove any existing highlighting
    var node;
    if(this.outlineNodeName) {
        node = this.scene.getObjectByName(this.outlineNodeName);
        if(node) {
            this.scene.remove(node);
            this.outlineNodeName = null;
        }
    }

    if(name) {
        node = this.scene.getObjectByName(name);
        if (node) {
            var outlineMat = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.BackSide});
            var outlineMesh;
            var outlineGeom;
            switch (this.guiControls.NodeStyle) {
                case 'Sphere':
                    outlineGeom = new THREE.SphereGeometry(1, 20, 20);
                    outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
                    outlineMesh.name = name + 'outline';
                    this.outlineNodeName = outlineMesh.name;
                    break;
            }
            outlineMesh.position = node.position;
            outlineMesh.scale.multiplyScalar(1.2);
            this.scene.add(outlineMesh);
        }
    }
};

VisApp.prototype.reDraw = function() {
    //Remove nodes
    this.removeNodes();

    this.generateData();
};

VisApp.prototype.createGUI = function() {
    //Create GUI - use dat.GUI for now
    this.guiControls = new function() {
        this.labelWidth = 35;
        this.labelHeight = 20;
        this.xAxisScale = 1.2;
        this.yAxisScale = 10;
        this.ShowLabels = true;
        this.LabelTop = 'Film';
        this.LabelBottom = '';

        //Colours
        this.Text = [255, 184, 57];
        this.Label = [55, 55, 55];
        this.Border = [0, 0, 0];
        this.Node = "#7777ff";
        this.Slider = "#5f7c9d";
        this.Ground = '#16283c';
        this.Background = '#5c5f64';
        //Node shapes
        this.NodeStyle = 'Sphere';
    };

    var gui = new dat.GUI();
    gui.close();

    //Folders
    var _this = this;
    this.guiAppear = gui.addFolder("Appearance");

    var labelWidth = this.guiAppear.add(this.guiControls, 'labelWidth', 1, 60);
    labelWidth.onChange(function(value) {
        _this.guiChanged();
    });

    var labelHeight = this.guiAppear.add(this.guiControls, 'labelHeight', 1, 50);
    labelHeight.onChange(function(value) {
        _this.guiChanged();
    });

    var xAxisScale = this.guiAppear.add(this.guiControls, 'xAxisScale', 0.01, 5, 0.01);
    xAxisScale.onChange(function(value) {
        _this.guiChanged();
    });

    var yAxisScale = this.guiAppear.add(this.guiControls, 'yAxisScale', 0.01, 25).step(0.001);
    yAxisScale.onChange(function(value) {
        _this.guiChanged();
    });

    this.guiAppear.add(this.guiControls, 'NodeStyle', ['Sphere', 'Cube', 'Diamond']).onChange(function(value) {
        _this.updateRequired = true;
    });

    this.guiAppear.addColor(this.guiControls, 'Text').onChange(function(value) {
        _this.textColourChanged(value);
    });
    this.guiAppear.addColor(this.guiControls, 'Label').onChange(function(value) {
        _this.updateRequired = true;
    });
    this.guiAppear.addColor(this.guiControls, 'Border').onChange(function(value) {
        _this.updateRequired = true;
    });
    this.guiAppear.addColor(this.guiControls, 'Node').onChange(function(value) {
        _this.nodeColourChanged(value);
    });
    this.guiAppear.addColor(this.guiControls, 'Slider').onChange(function(value) {
        _this.sliderColourChanged(value);
    });
    this.guiAppear.addColor(this.guiControls, 'Ground').onChange(function(value) {
        _this.groundColourChanged(value);
    });
    this.guiAppear.addColor(this.guiControls, 'Background').onChange(function(value) {
        _this.backgroundColourChanged(value);
    });
    this.guiAppear.add(this.guiControls, 'ShowLabels').onChange(function(value) {
        _this.labelChanged(value);
    });

    this.guiData = gui.addFolder("Data");
    this.gui = gui;
};

VisApp.prototype.guiChanged = function() {
    this.updateRequired = true;
};

VisApp.prototype.textColourChanged = function(value) {
    this.updateRequired = true;
};
VisApp.prototype.nodeColourChanged = function(value) {
    this.updateRequired = true;
};
VisApp.prototype.sliderColourChanged = function(value) {
    var slider = this.scene.getObjectByName('timeSlider', true);
    if(slider) {
        slider.material.color.setStyle(value);
    }
};
VisApp.prototype.groundColourChanged = function(value) {
    var ground = this.scene.getObjectByName('ground');
    if(ground) {
        ground.material.color.setStyle(value);
    }
};
VisApp.prototype.backgroundColourChanged = function(value) {
    this.renderer.setClearColor(value, 1.0);
};

VisApp.prototype.analyseItem = function(item, updatedData) {
    //Analyse this item and adjust appearance accordingly
    var update = null;
    if(!updatedData) return null;

    //See if item in updated data
    var key = item[this.xAxisName];
    if(key in updatedData) {
        var freq = updatedData[key][item[this.yAxisName]];
        if (freq != undefined) {
            update = { material: new THREE.MeshPhongMaterial({color: 0xff0000}),
                position: -freq * 10};
        }
    }
    return update;
};

VisApp.prototype.analyseData = function() {
    //Analyse data and configure accordingly
    var dupes = getDuplicates(this.data, this.xAxisName, this.yAxisName);

    return dupes;
};

VisApp.prototype.generateData = function() {
    //Analyse data first
    var updates = this.analyseData();

    var extraData = this.guiControls.extra;

    //Create node geometry
    var nodeGeometry;
    switch(this.guiControls.NodeStyle) {
        case 'Sphere':
            nodeGeometry = new THREE.SphereGeometry(1,20,20);
            break;

        case 'Cube':
            nodeGeometry = new THREE.BoxGeometry(2, 2, 2);
            break;

        case 'Diamond':
            nodeGeometry = new THREE.OctahedronGeometry(2);
            break;
    }

    var defaultMaterial = new THREE.MeshPhongMaterial({color: 0x7777ff});
    defaultMaterial.color.setStyle(this.guiControls.Node);
    var colourMaterial = new THREE.MeshPhongMaterial({color: 0x141414});
    var transparentMaterial = new THREE.MeshPhongMaterial({color: 0x7777ff, transparent: true, opacity: 0.1});

    var nodes = [];
    //Keep track of which nodes have been visited
    var visited = {};
    var updateRequired;
    var item, xAxis, yAxis, year, selection, minYear, maxYear, renderState;
    this.nodesInSlider = 0;
    for(var i=0; i<this.data.length; ++i) {
        //Only render nodes with valid axis values
        item = this.data[i];
        xAxis = item[this.xAxisName];
        yAxis = item[this.yAxisName];
        year = item[this.timeAxis];
        selection = this.guiControls.Selection/2;
        minYear = this.guiControls.year - selection;
        maxYear = this.guiControls.year + selection;
        renderState = RENDER_NORMAL;

        //DEBUG
        //console.log("Max=", maxYear, " min=", minYear);
        if(xAxis >= 0 && yAxis >= 0) {
            //Determine how we render this node
            if(year < minYear || year > maxYear) {
                renderState = RENDER_STYLE;
            } else {
                //Check any filtering
                var renderNode = true;
                for(var key in extraData) {
                    //Different action for numeric filtering
                    if(extraData[key] !== "" && extraData[key] !== item[key]) {
                        if(typeof extraData[key] === 'number') {
                            if(extraData[key] <= item[key]) {
                                renderState = RENDER_STYLE;
                                renderNode = false;
                                break;
                            }
                        }else {
                            renderState = RENDER_STYLE;
                            renderNode = false;
                            break;
                        }
                    }
                }
                if(renderNode) ++this.nodesInSlider;
            }
            //Examine data and adjust accordingly
            updateRequired = this.analyseItem(item, updates);
            if(updateRequired) {
                if(!(x in visited)) {
                    visited[xAxis] = {};
                    visited[xAxis][yAxis] = 0;
                }
                else {
                    ++(visited[xAxis][yAxis]);
                }
            }

            if(renderState !== RENDER_NORMAL) continue;

            var nodeMaterial = renderState === RENDER_NORMAL ? defaultMaterial :  transparentMaterial;
            //var node = new THREE.Mesh(sphereGeometry, updateRequired ? updateRequired.material : material);
            var node = new THREE.Mesh(nodeGeometry, nodeMaterial);
            node.position.x = item[this.xAxisName] * this.guiControls.xAxisScale;
            node.position.y = item[this.yAxisName] * this.guiControls.yAxisScale;
            node.position.z = this.sliderEnabled ? (item[this.timeAxis]-this.yearMin)/(this.yearMax - this.yearMin) * this.GROUND_DEPTH - this.GROUND_DEPTH/2 : 0;
            var labelPos = new THREE.Vector3();
            labelPos.x = node.position.x;
            labelPos.y = node.position.y;
            labelPos.z = this.sliderEnabled ? node.position.z : updateRequired ? visited[xAxis][yAxis] * -5 : 0;
            //Give node a name
            node.name = 'Node ' + item[this.nameKey];
            ++this.nodesRendered;
            nodes.push(node);
            this.scene.add(node);
            if(this.guiControls.ShowLabels) {
                var top = this.guiControls.LabelTop === '' ? null : this.guiControls.LabelTop;
                var bottom = this.guiControls.LabelBottom === '' ? null : this.guiControls.LabelBottom;
                var colour = this.guiControls.Text;
                this.generateLabels(item[top], item[bottom], labelPos, colour, this.guiControls.Label, this.guiControls.Border, nodeMaterial.opacity ? nodeMaterial.opacity : 1);
            }
        }
    }
};

VisApp.prototype.getDataItem = function(name) {
    //Get data given name
    for(var i=0; i<this.data.length; ++i) {
        var item = this.data[i];
        if(item[this.nameKey] === name) {
            return item;
        }
    }

    return null;
};

VisApp.prototype.generateLabels = function(topName, bottomName, position, textColour, labelColour, borderColour, opacity) {

    var fontSize = 18;
    var scale = new THREE.Vector3(this.guiControls.labelWidth, this.guiControls.labelHeight, 1);
    position.top = true;
    if(textColour != undefined) {
        spriteManager.setTextColour(textColour);
    }

    if(labelColour != undefined) {
        spriteManager.setBackgroundColour(labelColour);
    }

    if(borderColour != undefined) {
        spriteManager.setBorderColour(borderColour);
    }

    if(topName) {
        var labelTop = spriteManager.create(topName, position, scale, 32, 1, true);
        //Give sprite a name
        labelTop.name = "Sprite" + this.spritesRendered++;
        this.scene.add(labelTop);
    }

    position.top = false;
    if(bottomName) {
        position.y -= (3*scale.y/5);
        var labelBottom = spriteManager.create(bottomName, position, scale, 32, 1, true);
        //Give sprite a name
        labelBottom.name = "Sprite" + this.spritesRendered++;
        this.scene.add(labelBottom);
    }
};

function createLabel(name, position, scale, colour, fontSize, opacity) {

    var fontface = "Arial";
    var spacing = 10;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var metrics = context.measureText( name );
    var textWidth = metrics.width;

    canvas.width = textWidth + (spacing * 2);
    canvas.width *= 2;
    canvas.height = fontSize;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "rgba(255, 255, 255, 0.0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var red = Math.round(colour[0]);
    var green = Math.round(colour[1]);
    var blue = Math.round(colour[2]);

    context.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
    context.font = fontSize + "px " + fontface;

    context.fillText(name, canvas.width/2, canvas.height/2);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    //texture.needsUpdate = true;
    var spriteMaterial = new THREE.SpriteMaterial({
            //color: color,
            transparent: false,
            opacity: opacity,
            useScreenCoordinates: false,
            blending: THREE.AdditiveBlending,
            map: texture}
    );

    var sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(scale.x, scale.y, 1);
    sprite.position.set(position.x, position.y, position.z);

    return sprite;
}

VisApp.prototype.generateGUIControls = function() {

    //Get UI controls to add
    var i, index;
    var guiLabels = Object.keys(this.data[0]);
    this.xAxisName = guiLabels[guiLabels.length-2];
    this.yAxisName = guiLabels[guiLabels.length-1];
    this.timeAxis = 'year';
    this.nameKey = guiLabels[0];

    var extraGui = {};
    for(i=0; i<guiLabels.length; ++i) {
        extraGui[guiLabels[i]] = "";
    }

    //Create master and sub arrays
    var numRecords = this.data.length;
    var numAttribs = guiLabels.length;
    var master = new Array(numAttribs);

    for(var lists=0; lists<numAttribs; ++lists) {
        master[lists] = [];
    }

    //Populate arrays with relevant values
    var x=0;
    i=0;
    var item;
    for(var elem=0; elem<numRecords; ++elem) {
        item = this.data[elem];
        for(var key in item) {
            master[x++][i] = item[key];
        }
        ++i;
        x=0;
    }

    //Eliminate duplicates
    for(var arr=0; arr<master.length; ++arr) {
        master[arr] = eliminateDuplicates(master[arr]);
        master[arr] = eliminateInvalidCells(master[arr]);
    }

    var _this = this;
    this.guiControls.extra = extraGui;
    for(var label=1; label<guiLabels.length; ++label) {
        var max, min;
        if(guiLabels[label] == this.timeAxis) {
            master[label].sort(function(a,b) {
                return a-b;
            });
            //Assume this is time-based data
            max = master[label][master[label].length-1];
            min = master[label][0];
            this.yearMax = max;
            this.yearMin =  min;
            this.guiControls.year = (max-min)/2 + min;
            var yearChange = this.guiData.add(this.guiControls, guiLabels[label].toString(), min, max).step(1);
            yearChange.listen();
            yearChange.onChange(function(value) {
                _this.updateRequired = true;
            });
            //Add slider depth info
            this.guiControls.Selection = 10;
            this.guiControls.ShowSlider = true;
            var selection = this.guiData.add(this.guiControls, 'Selection', 1, (max-min)*2).step(2);
            selection.listen();
            selection.onChange(function(value) {
                _this.updateRequired = true;
            });
            var timeSlider = this.guiData.add(this.guiControls, 'ShowSlider').listen();
            timeSlider.onChange(function(value) {
                _this.toggleSlider(value);
            });
        }
        else {
            //Convert all numeric values to sliders
            var control=null;
            if(typeof master[label][0] === 'number') {
                master[label].sort(function(a,b) {
                    return a-b;
                });
                min = master[label][0];
                max = master[label][master[label].length-1];
                //Set default value of field
                var field = guiLabels[label].toString();
                this.guiControls.extra[field] = max;
                control = this.guiData.add(this.guiControls.extra, field, min, max);
            } else {
                //Add drop down list of values
                master[label].splice(0, 0, "");
                control = this.guiData.add(this.guiControls.extra, guiLabels[label].toString(), master[label]);
            }

            if(control != null) {
                control.onChange(function(value) {
                    _this.updateRequired = true;
                });
            }
        }
    }

    //DEBUG
    //console.log('Object =', this.guiData.__controllers);
    //var controller = this.guiData.__controllers[0];
    //this.guiDeleted.add(controller);
    //this.guiData.remove(controller);

    //Labelling
    var displayLabels = guiLabels;
    displayLabels.splice(0, 0, '');
    //displayLabels.splice(0, 0, '', 'Project name');
    this.guiAppear.add(this.guiControls, 'LabelTop', displayLabels).onChange(function(value) {
        _this.updateRequired = true;
    });

    this.guiAppear.add(this.guiControls, 'LabelBottom', displayLabels).onChange(function(value) {
        _this.updateRequired = true;
    });
};

VisApp.prototype.toggleSlider = function(slider) {
    //Toggle slider visibility
    var box = this.scene.getObjectByName("timeSlider", true);
    if(box) {
        box.visible = slider;
        this.sliderEnabled = slider;
    }
    this.updateRequired = true;
};

VisApp.prototype.changeView = function(view) {
    //Alter cam view
    this.controls.reset();
    this.camera.position.set(450, 150, 420);
    this.controls.setLookAt(new THREE.Vector3(170, 90, 0));
};

VisApp.prototype.savePreset = function() {
    //Save visualisation details
    if(!this.data) return;

    var tempCamPos = new THREE.Vector3().copy(this.camera.position);
    var tempCamRot = new THREE.Quaternion().copy(this.camera.quaternion);
    var tempLookat = new THREE.Vector3().copy(this.controls.getLookAt());

    //Save slider details
    var showSlider = this.guiControls.ShowSlider;
    var sliderPos = this.guiControls.year;
    var sliderWidth = this.guiControls.Selection;

    var presetDetails = {pos : tempCamPos, rot : tempCamRot, look : tempLookat,
                         showSlider : showSlider, sliderPos : sliderPos, sliderWidth : sliderWidth};

    this.camPos.push(presetDetails);

    //Update preset value
    updatePresets(this.currentCamPos+1, this.camPos.length);
};

VisApp.prototype.gotoNextPreset = function() {
    //Go to next cam pos in list if possible
    if(this.camPos.length < 0) return;

    if(this.currentCamPos >= this.camPos.length-1) return;

    ++this.currentCamPos;
    var presetDetails = this.camPos[this.currentCamPos];

    //Camera details
    this.controls.reset();
    this.controls.setCameraRotation(presetDetails.rot);
    this.camera.position.set(presetDetails.pos.x, presetDetails.pos.y, presetDetails.pos.z);
    this.controls.setLookAt(presetDetails.look);

    //Slider details
    this.guiControls.ShowSlider = presetDetails.showSlider;
    this.toggleSlider(presetDetails.showSlider);
    this.guiControls.year = presetDetails.sliderPos;
    this.guiControls.Selection = presetDetails.sliderWidth;
    this.updateRequired = true;

    //Update preset value
    updatePresets(this.currentCamPos+1, this.camPos.length);
};

VisApp.prototype.gotoPreviousPreset = function() {
    //Go to previous cam pos if possible
    if(this.camPos.length < 0) return;

    if(this.currentCamPos <= 0) {
        if(this.currentCamPos == 0 && this.camPos.length == 1) {
            this.currentCamPos = 1;
        } else {
            return;
        }
    }

    --this.currentCamPos;
    var presetDetails = this.camPos[this.currentCamPos];

    //Camera details
    this.controls.reset();
    this.controls.setCameraRotation(presetDetails.rot);
    this.camera.position.set(presetDetails.pos.x, presetDetails.pos.y, presetDetails.pos.z);
    this.controls.setLookAt(presetDetails.look);

    //Slider details
    this.guiControls.ShowSlider = presetDetails.showSlider;
    this.toggleSlider(presetDetails.showSlider);
    this.guiControls.year = presetDetails.sliderPos;
    this.guiControls.Selection = presetDetails.sliderWidth;
    this.updateRequired = true;

    //Update preset value
    updatePresets(this.currentCamPos+1, this.camPos.length);
};

function updatePresets(preset, total) {
    if(preset < 1) preset = '*';
    document.getElementById('presetNum').innerHTML = 'Preset :  ' + preset + '/' + total;
}

VisApp.prototype.updateInfoPanel = function(year, duration, objects) {
    //Update info GUI
    document.getElementById('currentYear').innerHTML = year;
    document.getElementById('startYear').innerHTML = year - duration/2;
    document.getElementById('endYear').innerHTML = year + duration/2;
    document.getElementById('rendered').innerHTML = objects;
};

VisApp.prototype.reset = function() {
    //Reset rendering and data
    this.removeNodes();

    //Clear data
    this.data = null;
    this.dataFile = null;
    this.filename = "";

    //Clear gui controls
    this.guiControls = null;
    this.guiAppear = null;
    this.guiData = null;
    this.guiDeleted = null;
    this.gui.destroy();
    this.renderStyle = RENDER_CULL;
    this.createGUI();
};

VisApp.prototype.keydown = function(event) {
    //Do any key processing
    switch(event.keyCode) {
        case 80: //P
            console.log("Cam =", this.camera.position);
            console.log("Look =", this.controls.getLookAt());
            break;

        default :
            break;
    }
};

function addAxes(group) {
    //Create axes;
    //Set up common material
    var material = new THREE.MeshPhongMaterial({color: 0x7777ff});

    //Add graph axes
    var axisYHeight = 200;
    var axisXHeight = 350;
    var axisWidth = 2;
    var cylinderY = new THREE.CylinderGeometry(axisWidth/2, axisWidth/2, axisYHeight, 8, 8, false);
    var cylinderX = new THREE.CylinderGeometry(axisWidth/2, axisWidth/2, axisXHeight, 8, 8, false);

    var axisX = new THREE.Mesh(cylinderX, material);
    var axisY = new THREE.Mesh(cylinderY, material);

    //Orientate axes
    axisX.rotation.z = -Math.PI/2;
    axisX.position.set(axisXHeight/2, 0, 0);
    axisY.position.set(0, axisYHeight/2, 0);

    group.add(axisX);
    group.add(axisY);

    //Labelling
    var options = {
        size: 4,
        height: 1,
        weight: "normal",
        font: "helvetiker",
        bevelThickness: 0.2,
        bevelSize: 0.1,
        bevelSegments: 2,
        bevelEnabled: false,
        curveSegments: 12,
        steps: 1
    };

    var textGeom = new THREE.TextGeometry("Gross", options);
    var axisText = new THREE.Mesh(textGeom, material);
    axisText.position.x = axisXHeight + 2;
    axisText.position.y = 0;
    axisText.position.z = 0;
    group.add(axisText);
    textGeom = new THREE.TextGeometry("Rating", options);
    axisText = new THREE.Mesh(textGeom, material);
    axisText.position.x = -10;
    axisText.position.y = axisYHeight + 2;
    axisText.position.z = 0;
    group.add(axisText);
}

function addGroundPlane(scene, width, height) {
    // create the ground plane
    var planeGeometry = new THREE.PlaneBufferGeometry(width,height,1,1);
    var texture = THREE.ImageUtils.loadTexture("images/grid.png");
    var planeMaterial = new THREE.MeshLambertMaterial({map: texture, transparent: true, opacity: 0.5});
    var plane = new THREE.Mesh(planeGeometry,planeMaterial);
    var overlap = 10;

    // rotate and position the plane
    plane.rotation.x=-0.5*Math.PI;
    plane.position.set(width/2 - overlap, 0, 0);

    scene.add(plane);

    //Second plane
    planeGeometry = new THREE.PlaneBufferGeometry(width, height, 1, 1);
    planeMaterial = new THREE.MeshLambertMaterial({color: 0x16283c});
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x=-0.5*Math.PI;
    plane.position.set(width/2 - overlap, -1, 0);

    //Give it a name
    plane.name = 'ground';

    // add the plane to the scene
    scene.add(plane);
}

function addTimeSlider(group, width, height, depth) {
    //Create time slider box
    //DEBUG - DEPTH NEEDS REWORKING
    var boxGeometry = new THREE.BoxGeometry(width, height, 1, 4, 4, 4);
    var boxMaterial = new THREE.MeshPhongMaterial({color: 0x5f7c9d, transparent: true, opacity: 0.4, depthTest: false});
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.name = 'timeSlider';
    box.position.set(width/2, height/2, 0);

    group.add(box);
}

//Only executed our code once the DOM is ready.
var FRONT= 0, RIGHT= 1, LEFT= 2, TOP=3;
$(document).ready(function() {
    //Initialise app
    //skel.init();
    var container = document.getElementById("WebGL-output");
    var app = new VisApp();
    app.init(container);
    app.createGUI();
    app.createScene();

    //GUI callbacks
    $("#camFront").on("click", function(evt) {
        app.changeView(FRONT);
    });
    $("#camRight").on("click", function(evt) {
        app.changeView(RIGHT);
    });
    $("#camLeft").on("click", function(evt) {
        app.changeView(LEFT);
    });
    $("#camTop").on("click", function(evt) {
        app.changeView(TOP);
    });

    $("#presetSave").on("click", function(evt) {
        app.savePreset();
    });
    $("#presetForward").on("click", function(evt) {
        app.gotoNextPreset();
    });
    $("#presetBackward").on("click", function(evt) {
        app.gotoPreviousPreset();
    });

    $('#screen').on("click", function(event) {
        event.preventDefault();
        var can = app.renderer.domElement;
        if (can) {
            try {
                can.toBlob(function(blob) {
                    saveAs(blob, "screenShot.png");
                }, "image/png");
            } catch(e) {
                alert("Couldn't save screenshot");
            }
        }
    });

    var currentYearElem = $('#yearNumber');
    var currentYear;
    currentYearElem.on("input", function() {
        currentYear = currentYearElem.val();
        //console.log("Year = ", currentYear);
        app.updateYear(currentYear);
    });

    var currentRangeElem = $('#yearRange');
    var currentRange;
    currentRangeElem.on("input", function() {
        currentRange = currentRangeElem.val();
        //console.log("Range = ", currentRange);
        app.updateRange(currentRange);
    });

    $(document).keydown(function(event) {
        app.keydown(event);
    });

    app.run();
});
