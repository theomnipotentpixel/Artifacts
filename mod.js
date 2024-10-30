let dontInit = false;
let dontInitTiers = false;
let ARE_ARTIFACT_CHEATS_ENABLED = false;
// in case anyone wants to override things
if(typeof ARTIFACTS_SHOULD_NOT_INIT !== 'undefined') {
    // if this runs, it means another mod is overriding some of the default mod behavior
    dontInit = ARTIFACTS_SHOULD_NOT_INIT;
}
if(typeof ARTIFACTS_SHOULD_NOT_INIT_TIERS !== 'undefined') {
    // if this runs, it means another mod is overriding some of the default mod behavior
    dontInitTiers = ARTIFACTS_SHOULD_NOT_INIT_TIERS;
}
if(!dontInit)
    var ARTIFACTS = {a:{}};

if(!ARTIFACTS.DEFAULTS)
    ARTIFACTS.DEFAULTS = {};

if(!ARTIFACTS.CAN_DISCOVER_ARTIFACTS)
    ARTIFACTS.CAN_DISCOVER_ARTIFACTS = false;

if(!ARTIFACTS.DEFAULTS.DEFAULT_ARTIFACT){
    ARTIFACTS.DEFAULTS.DEFAULT_ARTIFACT = {
        amount: 0,
        discoveredPrior: false
    };
}

if(!dontInitTiers){
    var ARTIFACT_TIERS = [
        {tier:"Common", amountNeeded: 1},
        {tier:"Uncommon", amountNeeded: 20},
        {tier:"Rare", amountNeeded: 50},
        {tier:"Epic", amountNeeded: 250},
        {tier:"Legendary", amountNeeded: 1000},
        {tier:"Mythic", amountNeeded: 10000},
        {tier:"_", amountNeeded: Infinity},
    ];
}

if(!ARTIFACTS.discovery_audios)
    ARTIFACTS.discovery_audios = {};

if(!ARTIFACTS.modPath){
    let tmp = document.currentScript.src;
    tmp = tmp.split("/");
    tmp.pop();
    tmp = tmp.join("/");
    ARTIFACTS.modPath = tmp;
}



// Audio.get().playSound(Audio.get().buttonSound);

if(!ARTIFACTS.DEFAULTS.firstDiscoveryAudio){
    ARTIFACTS.DEFAULTS.noFirstDiscoveryAudio = PIXI.sound.Sound.from({ url : `${ARTIFACTS.modPath}\\sounds\\artifacts_no_first_discovery.mp3`, preload : true});
    ARTIFACTS.DEFAULTS.defaultFirstDiscoveryAudio = PIXI.sound.Sound.from({ url : `${ARTIFACTS.modPath}\\sounds\\artifacts_default_first_discovery.wav`, preload : true});
}

if(!ARTIFACTS.discoveryMultipliers)
    ARTIFACTS.discoveryMultipliers = {
        artifacts_base: 1
    };

if(!ARTIFACTS.getAllIds)
ARTIFACTS.getAllIds = function(includeUniques, includeMaxed){
    if(includeUniques == null)
        includeUniques = true;
    if(includeMaxed == null)
        includeMaxed = true;
    let ids = [];
    for (const [k, v] of Object.entries(ARTIFACTS.a)) {
        if(!includeUniques && v.isUnique)
            continue;
        if((ARTIFACT_TIERS[v.tier+1].amountNeeded == Infinity && !includeMaxed) || (v.isUnique && v.data.amount == 1 && !includeMaxed))
            continue;
        ids.push(k);
    }
    return ids;
}


if(!ARTIFACTS.getAllUniqueIds)
ARTIFACTS.getAllUniqueIds = function(includeDiscovered){
    if(includeDiscovered == null)
        includeDiscovered = true;
    let ids = [];
    for (const [k, v] of Object.entries(ARTIFACTS.a)) {
        if(!v.isUnique)
            continue;
        if(v.data.amount == 1 && !includeDiscovered)
            continue;
        ids.push(k);
    }
    return ids;
}


if(!ARTIFACTS.getDiscoveryMultiplier)
ARTIFACTS.getDiscoveryMultiplier = function(){
    let mult = 1;
    for (const [k, v] of Object.entries(ARTIFACTS.discoveryMultipliers)) {
        mult *= v;
    }
    return mult;
}

// generates n random artifacts where min and max are both inclusive
if(!ARTIFACTS.discoverArtifacts)
ARTIFACTS.discoverArtifacts = function(amountMin, amountMax, allowUniques, pregeneratedList){
    if(allowUniques == null)
        allowUniques = false;
    let allApplicable;
    if(pregeneratedList == undefined)
        allApplicable = ARTIFACTS.getAllIds(allowUniques, false);
    else
        allApplicable = pregeneratedList;
    let generatedArtifacts = {};
    let amountToGenerate = random_Random.getInt(amountMin, amountMax+1);
    if(allApplicable.length == 0){
        console.warn("WARN: Attempted do discover artifacts, but no applicable artifacts were found! (ARTIFACTS.discoverArtifacts)");
        return {};
    }
    for(let i = 0; i < amountToGenerate; i++){
        let artifact = random_Random.fromArray(allApplicable);
        if(generatedArtifacts[artifact] == null)
            generatedArtifacts[artifact] = 1;
        else
            generatedArtifacts[artifact] += 1;
    }

    for (const [k, v] of Object.entries(generatedArtifacts)) {
        ARTIFACTS.gainOrLoseArtifactAmount(k, v);
    }
    return generatedArtifacts;
}

if(!ARTIFACTS.updateTiers)
ARTIFACTS.updateTiers = function(){
    let allArtifacts = ARTIFACTS.getAllIds();
    for(let id of allArtifacts){
        for(let i = 0; i < ARTIFACT_TIERS.length; i++){
            if(ARTIFACTS.a[id].data.amount < ARTIFACT_TIERS[i+1].amountNeeded){
                ARTIFACTS.a[id].tier = i;
                break;
            }
        }
    }
}

//                                   string,   string,     string,                string,         function(thisArtifact), function(thisArtifact), function(thisArtifact, newAmount, isFirst), bool, object
if(!ARTIFACTS.registerArtifactFull)
ARTIFACTS.registerArtifactFull = function(id, artifactDisplayName, artifactSprite, artifactDescription, artifactCurrentEffectText, onAmountChange, isUnique, overrides){
    if(overrides == null)
        overrides = {};
    if(overrides.onDiscoverySound == false)
        overrides.onDiscoverySound = ARTIFACTS.DEFAULTS.noFirstDiscoveryAudio;
    
    ARTIFACTS.a[id] = {
        id: id,
        displayName: artifactDisplayName,
        description: artifactDescription,
        currentEffect: artifactCurrentEffectText,
        onChange: onAmountChange,
        spr: artifactSprite,
        data: JSON.parse(JSON.stringify(ARTIFACTS.DEFAULTS.DEFAULT_ARTIFACT)),
        tier: 0,
        isUnique: isUnique,
        overrides: overrides == null ? {} : overrides
    }
    if(typeof artifactDescription == "function")
        ARTIFACTS.a[id].getDescription = function(){return ARTIFACTS.a[id].description(ARTIFACTS.a[id])};
    else
        ARTIFACTS.a[id].getDescription = function(){return ARTIFACTS.a[id].description};
    
    if(typeof artifactCurrentEffectText == "function")
        ARTIFACTS.a[id].getCurrentEffectText = function(){return ARTIFACTS.a[id].currentEffect(ARTIFACTS.a[id])}
    else
        ARTIFACTS.a[id].getDescription = function(){return ARTIFACTS.a[id].currentEffect};
}

if(!ARTIFACTS.TEMP_LOAD)
ARTIFACTS.TEMP_LOAD = {};

// id, function(thisArtifact), function(thisArtifact, newAmount, isFirst), function(thisArtifact), {onDiscoevrySound}
if(!ARTIFACTS.registerArtifact)
ARTIFACTS.registerArtifact = function(id, currentEffectText, onAmountChange, dynamicDescription, overrides){
    ARTIFACTS.TEMP_LOAD[id] = {
        id: id,
        currentEffectText: currentEffectText,
        onAmountChange: onAmountChange,
        dynamicDescription: dynamicDescription,
        overrides: overrides
    };
}

if(!ARTIFACTS.gainOrLoseArtifactAmount)
ARTIFACTS.gainOrLoseArtifactAmount = function(id, amount){
    amount = Math.trunc(amount);
    if(amount == 0)
        return;
    if(ARTIFACTS.a[id]){
        let isFirst = false;
        if(amount > 0 && !ARTIFACTS.a[id].data.discoveredPrior){
            isFirst = true;
            ARTIFACTS.a[id].data.discoveredPrior = true;

            if(ARTIFACTS.a[id].overrides.onDiscoverySound)
                Audio.get().playSound(ARTIFACTS.a[id].overrides.onDiscoverySound);
            else
                Audio.get().playSound(ARTIFACTS.DEFAULTS.defaultFirstDiscoveryAudio);
        }
        ARTIFACTS.a[id].data.amount += amount;
        if(ARTIFACTS.a[id].data.amount < 0)
            ARTIFACTS.a[id].data.amount = 0;

        if(ARTIFACTS.a[id].isUnique)
            ARTIFACTS.a[id].data.amount = Math.min(1, Math.max(ARTIFACTS.a[id].data.amount, 0));

        for(let i = 0; i < ARTIFACT_TIERS.length; i++){
            if(ARTIFACTS.a[id].data.amount < ARTIFACT_TIERS[i+1].amountNeeded){
                ARTIFACTS.a[id].tier = i;
                break;
            }
        }
        ARTIFACTS.a[id].onChange(ARTIFACTS.a[id], ARTIFACTS.a[id].data.amount, isFirst);
    } else {
        console.warn(`WARN: Attempted to edit artifact count of artifact "${id}", but artifact has not been registered! (ARTIFACTS.gainOrLoseArtifactAmount)`);
    }
}

if(!ARTIFACTS.setArtifactAmount)
ARTIFACTS.setArtifactAmount = function(id, amount){
    amount = Math.max(Math.trunc(amount), 0);
    if(ARTIFACTS.a[id]){
        let isFirst = false;
        if(amount > 0 && !ARTIFACTS.a[id].data.discoveredPrior){
            isFirst = true;
            ARTIFACTS.a[id].data.discoveredPrior = true;

            if(ARTIFACTS.a[id].overrides.onDiscoverySound)
                Audio.get().playSound(ARTIFACTS.a[id].overrides.onDiscoverySound);
            else
                Audio.get().playSound(ARTIFACTS.DEFAULTS.defaultFirstDiscoveryAudio);
        }
        ARTIFACTS.a[id].data.amount = amount;

        for(let i = 0; i < ARTIFACT_TIERS.length; i++){
            if(ARTIFACTS.a[id].data.amount < ARTIFACT_TIERS[i+1].amountNeeded){
                ARTIFACTS.a[id].tier = i;
                break;
            }
        }

        ARTIFACTS.a[id].onChange(ARTIFACTS.a[id], ARTIFACTS.a[id].amount, isFirst);
    } else {
        console.warn(`WARN: Attempted to edit artifact count of artifact "${id}", but artifact has not been registered! (ARTIFACTS.setArtifactAmount)`);
    }
}

ModTools.makeBuilding("pixl_ArtifactGallery", (superClass) => { return {
    __constructor__: function(game, stage, bgStage, city, world, position, worldPosition, id){
        superClass.call(this, game, stage, bgStage, city, world, position, worldPosition, id);
        this.maxArtifactsPerRow = 8;
        this.ownerBuilding = "pixl_ArtifactHunters";
        ARTIFACTS.CAN_DISCOVER_ARTIFACTS = true;
    },
    onBuild: function(){
        ARTIFACTS.CAN_DISCOVER_ARTIFACTS = true;
    },
    getNOwnerBuildings: function(){
        let blds = this.city.getAmountOfPermanentsPerType();
        let nOwnerBuilding = Object.prototype.hasOwnProperty.call(blds.h,"buildings."+this.ownerBuilding) ? 
            blds.h["buildings."+this.ownerBuilding] : 0;
        return nOwnerBuilding;
    },
    addWindowInfoLines: function(){
        superClass.prototype.addWindowInfoLines.call(this);
        // ARTIFACTS.discoverArtifacts(10, 10, true);
        // let _this = this;
        if(this.getNOwnerBuildings() == 0){
            this.city.gui.windowAddInfoText(null,function() {
                return "Build the Artifact Hunters HQ to unlock!";
            });
            return;
        }
        let row = new gui_GUIContainer(this.city.gui, this.city.gui.innerWindowStage, this.city.gui.windowInner);
        let i = -1;
        for(const [id, artifact] of Object.entries(ARTIFACTS.a)){
            let artifactDisp = this.addArtifactDisplay(artifact);
            if(artifactDisp)
                i++;
            else
                continue;
            if(i == this.maxArtifactsPerRow){
                i = 0;
                this.city.gui.windowInner.addChild(row);
                row = new gui_GUIContainer(this.city.gui, this.city.gui.innerWindowStage, this.city.gui.windowInner);
                this.city.gui.windowInner.addChild(new gui_GUISpacing(this.city.gui.windowInner,new common_Point(2,5)));
            }

            if(artifactDisp){
                row.addChild(artifactDisp);
                row.addChild(new gui_GUISpacing(row, new common_Point(2,10)));
            }
        }
        if(i == -1){
            this.city.gui.windowAddInfoText("You don't own any artifacts currently!");
        } else {
            this.city.gui.windowInner.addChild(row);
            this.city.gui.windowInner.addChild(new gui_GUISpacing(this.city.gui.windowInner,new common_Point(2,10)));
        }
    },
    addArtifactDisplay: function(artifact){
        // let container = new gui_GUIContainer(this.city.gui, this.city.gui.innerWindowStage, this.city.gui.windowInner)
        if(artifact.data.amount == 0)
            return;
        let texture = Resources.getTexture(artifact.spr)
        if (!texture.valid) texture = Resources.getTexture("spr_pixl_artifact_unknown")
        // let artifactButton = this.city.gui.windowAddSimpleButton(texture, () => {
        //     // _this.materialFrom = _i;
        // }, " ")
        // artifactButton.container.padding = { left : 4, right : 4, top : 4, bottom : 4}
        // artifactButton.container.margin = { left : 4, right : 4, top : 4, bottom : 4}
        // artifactButton.rect.width = 28;
        // artifactButton.rect.height = 28;

        //gui,stage,parent,action,isActive,onHover,buttonSpriteName,backColor,frontColor,autoSetProgress  	infoButton.container.addChild(new gui_ContainerHolder(infoButton.container,stage,new PIXI.Sprite(Resources.getTexture(textureName))));
        
        let _this = this;
        let col;
        let isUnique = artifact.isUnique;
        let progress = artifact.data.amount / ARTIFACT_TIERS[artifact.tier+1].amountNeeded;
        let isMaxTier = ARTIFACT_TIERS[artifact.tier+1].amountNeeded == Infinity;

        if(isUnique){
            col = 0xFAC51C;
        } else if(isMaxTier){
            col = 0xFF55FF;
        } else {
            col = ((255 - Math.round(progress * 255)) << 16) +
            ((Math.round(progress * 255)) << 8);
        }

        let upgradeProgressBar = new gui_ContainerButtonWithProgress(this.city.gui, this.city.gui.innerWindowStage, this.city.gui.windowInner, ()=>{}, ()=>{return true},
        ()=>{
            _this.city.gui.tooltip.setText(this.city.gui.windowInner, 
                artifact.displayName + "\n\n" +
                (isUnique ? "Unique\n" : `${ARTIFACT_TIERS[artifact.tier].tier}\n`) + (isUnique ? `` : `${artifact.data.amount} / ${ARTIFACT_TIERS[artifact.tier+1].amountNeeded} left for upgrade\n`) +
                artifact.getDescription() + "\n" +
                artifact.getCurrentEffectText(),
                null,
                null,
                isUnique ? [{ texture : Resources.getTexture("spr_uniquebuilding"), text : " "}] : []
            )
        }, "spr_button", 10526880, col, ()=>{
            let isMaxTier = ARTIFACT_TIERS[artifact.tier+1].amountNeeded == Infinity;
            if(isMaxTier || isUnique)
                return 1;
            return artifact.data.amount / ARTIFACT_TIERS[artifact.tier+1].amountNeeded;
        });
        upgradeProgressBar.padding = { left : 2, right : 3, top : 2, bottom : 1}
        upgradeProgressBar.container.addChild(new gui_ContainerHolder(upgradeProgressBar.container,this.city.gui.innerWindowStage,new PIXI.Sprite(texture), { left : 2, right : 2, top : 2, bottom : 2}));
        return upgradeProgressBar;
        
    }
}}, "spr_artifact_gallery",
function(queue){

},
function(queue){

});

ModTools.makeBuilding("pixl_ArtifactHunters", (superClass) => { return {
    onBuild: function(){
        this.city.progress.unlocks.unlock(buildings_pixl_ArtifactGallery);
    },
	addWindowInfoLines: function() {
		var _gthis = this;
		buildings_WorkWithHome.prototype.addWindowInfoLines.call(this);
		this.city.gui.windowInner.addChild(new gui_GUISpacing(this.city.gui.window,new common_Point(4,4)));
		var anySQ = false;
		if(this.currentMission == 8) {
			anySQ = gui_CurrentMissionsWindow.displaySidequestsWithTag(this.city,this.city.gui,this.city.gui.innerWindowStage,this.city.gui.windowInner,"SecretSociety");
		}
		if(!this.isScenarioVariant && !anySQ) {
			this.city.gui.windowAddInfoText(null,function() {
				return _gthis.missionGetTitle();
			},"Arial15");
			this.city.gui.windowAddInfoText(null,function() {
				return _gthis.missionGetText();
			});
		}
	},
    getMissions: function(){
        return this.missions;
    },
    missionGetTitle: function() {
		if(this.currentMission == this.getMissions().length) {
			return common_Localize.lo("thank_you");
		}
		return common_Localize.lo("current_task");
	}
	,missionGetText: function() {
		if(this.currentMission >= this.getMissions().length) {
			return common_Localize.lo("forever_grateful");
		}
		if(this.workers.length != this.get_jobs()) {
			return "We need more hunters!\nMake sure all 6 jobs are filled!";
		}
        return this.getMissions()[this.currentMission].missionDescription +
            (this.getMissions()[this.currentMission].getDescriptionExtra ? "\n"+this.getMissions()[this.currentMission].getDescriptionExtra(this.city) : "");
	},
    checkMissionCompletions: function(){
        if(this.currentMission >= this.getMissions().length)
            return;
        while(this.currentMission < this.getMissions().length){
            let currentMission = this.getMissions()[this.currentMission];
            if(!currentMission.checkComplete(this.city))
                break;
            if(typeof currentMission.onComplete == "function"){
                currentMission.onComplete();
            }
            if(this.missionCompleteSound){
                Audio.get().playSound(this.missionCompleteSound);
            }
            this.currentMission++;
        }
    },
    update: function(timeMod) {
		superClass.prototype.update.call(this,timeMod);
        this.checkMissionCompletions();
	},
    getGlobalGoal: function() {
		if(this.currentMission == this.getMissions().length) {
			return null;
		}
		// return { category : common_Localize.lo("secret_society_mission"), text : this.missionGetText()};
        return { category: "Artifact Hunters Mission", text: this.missionGetText()};
	},
    __constructor__: function(game,stage,bgStage,city,world,position,worldPosition,id){
        this.currentMission = 0;
        buildings_WorkWithHome.call(this,game,stage,bgStage,city,world,position,worldPosition,id);
        
        this.missionCompleteSound = buildings_pixl_ArtifactHunters.missionCompleteSound;
        this.missions = [
            {
                missionDescription: "Build the Artifact Gallery",
                checkComplete: (city)=>{
                    let blds = city.getAmountOfPermanentsPerType();
                    return (Object.prototype.hasOwnProperty.call(blds.h,"buildings.pixl_ArtifactGallery") ? 
                        blds.h["buildings.pixl_ArtifactGallery"] : 0) == 1;
                }
            },
            {
                missionDescription: "Discover a normal artifact in a \"Nearby Space\" rocket mission!",
                checkComplete: (city)=>{
                    let allIds = ARTIFACTS.getAllIds(false);
                    for(id of allIds){
                        if(ARTIFACTS.a[id].data.amount > 0)
                            return true;
                    }
                    return false;
                }
            },
            {
                missionDescription: "Discover a unique artifact in a \"Distant Space\" rocket mission!",
                checkComplete: (city)=>{
                    let allIds = ARTIFACTS.getAllUniqueIds();
                    for(id of allIds){
                        if(ARTIFACTS.a[id].data.amount > 0)
                            return true;
                    }
                    return false;
                }
            },
            {
                missionDescription: "Get an artifact to the \"Rare\" tier!",
                checkComplete: (city)=>{
                    let allIds = ARTIFACTS.getAllIds(false);
                    for(id of allIds){
                        if(ARTIFACTS.a[id].tier >= 2)
                            return true;
                    }
                    return false;
                }
            },
            {
                missionDescription: "Unlock 5 Unique artifacts!",
                checkComplete: (city)=>{
                    let allIds = ARTIFACTS.getAllUniqueIds();
                    let nUniques = 0;
                    for(id of allIds){
                        if(ARTIFACTS.a[id].data.amount == 1)
                            nUniques++;
                    }
                    return nUniques >= 5;
                },
                getDescriptionExtra: function(city){
                    let allIds = ARTIFACTS.getAllUniqueIds();
                    let nUniques = 0;
                    for(id of allIds){
                        if(ARTIFACTS.a[id].data.amount == 1)
                            nUniques++;
                    }
                    return `Progress: ${nUniques} / 5`;
                }
            },
            {
                missionDescription: "Have 500 total artifacts!",
                checkComplete: (city)=>{
                    let allIds = ARTIFACTS.getAllIds();
                    let nLevels = 0;
                    for(id of allIds){
                        nLevels += ARTIFACTS.a[id].data.amount
                            
                    }
                    return nLevels >= 500;
                },
                getDescriptionExtra: function(city){
                    let allIds = ARTIFACTS.getAllIds();
                    let nLevels = 0;
                    for(id of allIds){
                        nLevels += ARTIFACTS.a[id].data.amount
                            
                    }
                    return `Progress: ${nLevels} / 500`;
                }
            },
            {
                missionDescription: "Have 1000 total artifacts!",
                checkComplete: (city)=>{
                    let allIds = ARTIFACTS.getAllIds();
                    let nLevels = 0;
                    for(id of allIds){
                        nLevels += ARTIFACTS.a[id].data.amount
                            
                    }
                    return nLevels >= 1000;
                },
                getDescriptionExtra: function(city){
                    let allIds = ARTIFACTS.getAllIds();
                    let nLevels = 0;
                    for(id of allIds){
                        nLevels += ARTIFACTS.a[id].data.amount
                            
                    }
                    return `Progress: ${nLevels} / 1000`;
                }
            },
            {
                missionDescription: "Have 2500 total artifacts!",
                checkComplete: (city)=>{
                    let allIds = ARTIFACTS.getAllIds();
                    let nLevels = 0;
                    for(id of allIds){
                        nLevels += ARTIFACTS.a[id].data.amount
                            
                    }
                    return nLevels >= 2500;
                },
                getDescriptionExtra: function(city){
                    let allIds = ARTIFACTS.getAllIds();
                    let nLevels = 0;
                    for(id of allIds){
                        nLevels += ARTIFACTS.a[id].data.amount
                            
                    }
                    return `Progress: ${nLevels} / 2500`;
                }
            },
        ];
    }
};}, "spr_artifact_hunters",
function(queue){
    queue.addInt(this.currentMission);
},
function(queue){
    this.currentMission = queue.readInt();
});

buildings_pixl_ArtifactHunters.missionCompleteSound = 
    PIXI.sound.Sound.from({ url : `${ARTIFACTS.modPath}\\sounds\\artifact_hunters_mission_complete.mp3`, preload : true});

ModTools.addBuildBasedUnlock(buildings_pixl_ArtifactHunters, function(blds) {
    return blds.h["buildings.GrapheneLab"] >= 1;
}, function(blds) {
    return blds.h["buildings.RocketLaunchPlatform"] >= 1;
});

Liquid.onInfoFilesLoaded("artifactsInfo.json", function(data){
    for(let artifact of data){
        let tl = ARTIFACTS.TEMP_LOAD[artifact.id];
        if(tl == null){
            console.warn("WARN: " + artifact.id + " has not been registered!");
            continue;
        }
        let desc;
        if(tl.dynamicDescription)
            desc = tl.dynamicDescription;
        else
            desc = artifact.description;
        if(desc == null){
            console.warn("WARN: " + artifact.id + " has no description in artifactsInfo.json and has not been given a dynamic description in registerArtifact!");
            continue;
        }
        let onAmountChange;
        if(tl.onAmountChange == null)
            onAmountChange = (a, amt, isFirst)=>{};
        else
            onAmountChange = tl.onAmountChange;
        let currentEffect;
        if(typeof tl.currentEffectText == "string")
            currentEffect = function(thisArtifact){return tl.currentEffectText};
        else
            currentEffect = tl.currentEffectText;
        ARTIFACTS.registerArtifactFull(artifact.id, artifact.displayName, artifact.image, desc, currentEffect, onAmountChange, artifact.isUnique, tl.overrides);
    }
});


// id, currentEffect, onAmountChange, dynamicDescription|null, overrides|null
// id, function(thisArtifact), function(thisArtifact, newAmount, isFirst), function(thisArtifact), {onDiscoevrySound}



ARTIFACTS.registerArtifact("artifacts_base::bonus_happiness", (a)=>{
    return "Currently adding " + (Math.floor((a.data.amount * 0.01 + a.tier * 0.5)*100)/100) + " bonus happiness!";
});

ARTIFACTS.registerArtifact("artifacts_base::cheaper_buildings", (a)=>{
    return `Current reduction: ${(Math.min(1000, a.data.amount) * 0.05).toFixed(2)}%`;
});

ARTIFACTS.registerArtifact("artifacts_base::cheaper_upgrades", (a)=>{
    return `Current reduction: ${(Math.min(1000, a.data.amount) * 0.05).toFixed(2)}%`;
});

ARTIFACTS.registerArtifact("artifacts_base::faster_factories", (a)=>{
    return `Current boost: +${(Math.min(1000, ARTIFACTS.a["artifacts_base::faster_factories"].data.amount) * 0.001).toFixed(2)}x`;
});

ARTIFACTS.registerArtifact("artifacts_base::artifact_discovery_mult", (a)=>{
    return `Current boost: +${(a.data.amount * 0.01).toFixed(2)}x`;
}, (a, amt, f)=>{
    ARTIFACTS.discoveryMultipliers.artifacts_base = a.data.amount * 0.01 + 1;
});

ARTIFACTS.registerArtifact("artifacts_base::supercomputer_output", "");

ARTIFACTS.registerArtifact("artifacts_base::machine_output", "");

ARTIFACTS.registerArtifact("artifacts_base::rocket_fuel_cost", "");

ARTIFACTS.registerArtifact("artifacts_base::extra_housing", "");

ARTIFACTS.registerArtifact("artifacts_base::bonus_housing_quality", "");

ModTools.addSaveDataEarly("pixl::artifacts",
function(city, queue, version){
    let t = {};
    for (const [k, v] of Object.entries(ARTIFACTS.a)) {
        t[k] = v.data
    }
    // console.log(t);
    queue.addString(JSON.stringify(t));
},
function(city, queue, version){
    let t = JSON.parse(queue.readString());
    // console.log(t);
    for (const [k, v] of Object.entries(t)) {
        if(ARTIFACTS.a[k])
            ARTIFACTS.a[k].data = v;
    }
    ARTIFACTS.updateTiers();
    // console.log(JSON.stringify(ARTIFACTS.a));
}, 0);

// for brand new worlds
ModTools.onCityCreate(function(city){
    for (const [k, v] of Object.entries(ARTIFACTS.a)) {
        ARTIFACTS.a[k].data = JSON.parse(JSON.stringify(ARTIFACTS.DEFAULTS.DEFAULT_ARTIFACT));
    }
    ARTIFACTS.updateTiers();
});

ModTools.onModsLoaded(function(){
    
});

(function(orig) {
    simulation_Happiness.prototype.getActualHappiness = function() {
        let happiness = orig.call(this);
        let bonusHappiness = ARTIFACTS.a["artifacts_base::bonus_happiness"].data.amount * 0.01 + ARTIFACTS.a["artifacts_base::bonus_happiness"].tier * 0.5;
        return happiness + bonusHappiness;
    }
} (simulation_Happiness.prototype.getActualHappiness));

(function(orig) {
    buildings_Supercomputer.prototype.get_knowledgePerDay = function() {
        let knowledgePerDay = orig.call(this);
        let mult = ARTIFACTS.a["artifacts_base::supercomputer_output"].data.amount + 1;
        return knowledgePerDay * mult;
    }
} (buildings_Supercomputer.prototype.get_knowledgePerDay));

(function(orig) {
    buildings_TheContraption.prototype.setReward = function() {
        let mult = ARTIFACTS.a["artifacts_base::machine_output"].data.amount + 1;
        let tmp = this.city.simulation.bonuses.theMachineBoost;
        this.city.simulation.bonuses.theMachineBoost *= mult;
        orig.call(this);
        this.city.simulation.bonuses.theMachineBoost = tmp;
    }
} (buildings_TheContraption.prototype.get_knowledgePerDay));

(function(orig) {
    simulation_RocketMission.prototype.fuelCost = function() {
        let fuel_cost = orig.call(this);
        let mult = ARTIFACTS.a["artifacts_base::rocket_fuel_cost"].data.amount + 1;
        return fuel_cost / mult;
    }
} (simulation_RocketMission.prototype.fuelCost));

(function(orig) {
    progress_BuildingCost.prototype.getBuildingCost = function(buildingInfo) {
        let buildingCost = orig.call(this, buildingInfo);
        let mult = Math.min(1000, ARTIFACTS.a["artifacts_base::cheaper_buildings"].data.amount) * 0.0005;
        buildingCost.multiply(1 - mult);
        return buildingCost;
    }
} (progress_BuildingCost.prototype.getBuildingCost));

(function(orig) {
    Materials.fromBuildingUpgradesInfo = function(buildingInfo) {
        let upgradeCost = orig.call(this, buildingInfo);
        let mult = Math.min(1000, ARTIFACTS.a["artifacts_base::cheaper_upgrades"].data.amount) * 0.0005;
        upgradeCost.multiply(1 - mult);
        return upgradeCost;
    }
} (Materials.fromBuildingUpgradesInfo));

(function(orig) {
    buildings_MaterialConvertingFactory.prototype.possiblyBeActive = function(timeMod) {
        let mult = 1 + Math.min(1000, ARTIFACTS.a["artifacts_base::faster_factories"].data.amount) * 0.001;
        return orig.call(this, timeMod*mult);
    }
} (buildings_MaterialConvertingFactory.prototype.possiblyBeActive));

(function(orig) {
    buildings_House.prototype.get_residentCapacity = function() {
        return orig.call(this) + ARTIFACTS.a["artifacts_base::extra_housing"].data.amount;
    }
} (buildings_House.prototype.get_residentCapacity));

(function(orig) {
    buildings_RedwoodTreeHouse.prototype.get_residentCapacity = function() {
        return orig.call(this) + ARTIFACTS.a["artifacts_base::extra_housing"].data.amount;
    }
} (buildings_RedwoodTreeHouse.prototype.get_residentCapacity));

(function(orig) {
    Permanent.prototype.get_attractiveness = function() {
        return orig.call(this) + ARTIFACTS.a["artifacts_base::bonus_housing_quality"].data.amount * 10;
    }
} (Permanent.prototype.get_attractiveness));

(function(orig) {
    simulation_RocketMission.prototype.giveMissionReward = function() {
        let dest = this.destination;
        orig.call(this);
        if(dest != 0 && dest != 1)
            return;
        if(dest == 0 && ARTIFACTS.CAN_DISCOVER_ARTIFACTS){
            let possibleArtifacts = ARTIFACTS.getAllIds(false, false);
            if(possibleArtifacts.length == 0)
                return;
            if(this.missionCompletionText == common_Localize.lo("mission_completed_nothing_found")){
                this.missionCompletionText = "";
            }
            this.missionCompletionText += "You found some artifacts!";
            let discoveredArtifacts = ARTIFACTS.discoverArtifacts(
                Math.ceil(25*ARTIFACTS.getDiscoveryMultiplier()),
                Math.ceil(50*ARTIFACTS.getDiscoveryMultiplier()),
                false, [random_Random.fromArray(possibleArtifacts), random_Random.fromArray(possibleArtifacts)]);
            for (const [k, v] of Object.entries(discoveredArtifacts)) {
                this.missionCompletionText += "\n" + ARTIFACTS.a[k].displayName + ": " + v;
            }
        }
        if(dest == 1 && ARTIFACTS.CAN_DISCOVER_ARTIFACTS){
            let possibleArtifacts = ARTIFACTS.getAllUniqueIds(false);
            if(possibleArtifacts.length == 0)
                return;
            if(this.missionCompletionText == common_Localize.lo("mission_completed_nothing_found")){
                this.missionCompletionText = "";
            }
            this.missionCompletionText += "You found an artifact!";
            let discoveredArtifacts = ARTIFACTS.discoverArtifacts(1, 1, false, [random_Random.fromArray(possibleArtifacts)]);
            for (const [k, v] of Object.entries(discoveredArtifacts)) {
                this.missionCompletionText += "\n" + ARTIFACTS.a[k].displayName + ": " + v;
            }
        }
    }
} (simulation_RocketMission.prototype.giveMissionReward));

// Liquid.addGeneralStatsButton(onClick(city), text(city), spriteName, position, isActive(city)?, onHover(city)?, keybind?)
if(ARE_ARTIFACT_CHEATS_ENABLED){
    Liquid.addGeneralStatsButton((city)=>{
        let shouldUnique = city.game.keyboard.down[16];
        let nArtifacts = city.game.keyboard.down[17] ? 5 : 1;
        if(!shouldUnique){
            ARTIFACTS.discoverArtifacts(nArtifacts, nArtifacts, false);
        } else {
            ARTIFACTS.discoverArtifacts(nArtifacts, nArtifacts, null, ARTIFACTS.getAllUniqueIds(false));
        }
    }, (city)=>{
        return "Gen Artifacts";
    }, "", -1, null, (city)=>{
        city.gui.tooltip.setText(city.gui.windowInner, "Shift+Click for a unique, Ctrl+Click for 5 at a time");
    });

    Liquid.addGeneralStatsButton((city)=>{
        let allArtifacts = ARTIFACTS.getAllIds();
        for(let id of allArtifacts){
            ARTIFACTS.setArtifactAmount(id, 0);
            ARTIFACTS.a[id].data.discoveredPrior = false;
        }
    }, (city)=>{
        return "Clear Artifacts";
    }, "", -1);
}