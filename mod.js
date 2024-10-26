let dontInit = false;
let dontInitTiers = false;
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

if(!ARTIFACTS.modPath)
    ARTIFACTS.modPath = _internalModHelpers.path + "\\" + Liquid.getModID();

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
        if((ARTIFACT_TIERS[v.tier+1].amountNeeded == Infinity && !includeMaxed) || (v.isUnique && v.data.amount == 1))
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

//                                   string,   string,     string,                string,         function(thisArtifact), function(thisArtifact), function(thisArtifact, newAmount, isFirst), bool
if(!ARTIFACTS.registerArtifact)
ARTIFACTS.registerArtifact = function(modName, artifactName, artifactDisplayName, artifactSprite, artifactDescription, artifactCurrentEffectText, onAmountChange, isUnique, overrides){
    if(overrides == null)
        overrides = {};
    if(overrides.onDiscoverySound == false)
        overrides.onDiscoverySound = ARTIFACTS.DEFAULTS.noFirstDiscoveryAudio;
    
    ARTIFACTS.a[modName + "::" + artifactName] = {
        id: modName + "::" + artifactName,
        displayName: artifactDisplayName,
        description: artifactDescription,
        currentEffect: artifactCurrentEffectText,
        onChange: onAmountChange,
        spr: artifactSprite,
        data: ARTIFACTS.DEFAULTS.DEFAULT_ARTIFACT,
        tier: 0,
        isUnique: isUnique,
        overrides: overrides == null ? {} : overrides
    }
    ARTIFACTS.a[modName + "::" + artifactName].getDescription = function(){return ARTIFACTS.a[modName + "::" + artifactName].description(ARTIFACTS.a[modName + "::" + artifactName])}
    ARTIFACTS.a[modName + "::" + artifactName].getCurrentEffectText = function(){return ARTIFACTS.a[modName + "::" + artifactName].currentEffect(ARTIFACTS.a[modName + "::" + artifactName])}
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
        ARTIFACTS.a[id].onChange(ARTIFACTS, ARTIFACTS.a[id], ARTIFACTS.a[id].data.amount, isFirst);
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

        ARTIFACTS.a[id].onChange(ARTIFACTS, ARTIFACTS.a[id], ARTIFACTS.a[id].amount, isFirst);
    } else {
        console.warn(`WARN: Attempted to edit artifact count of artifact "${id}", but artifact has not been registered! (ARTIFACTS.setArtifactAmount)`);
    }
}

ModTools.makeBuilding("pixl_ArtifactGallery", (superClass) => { return {
    __constructor__: function(game, stage, bgStage, city, world, position, worldPosition, id){
        superClass.call(this, game, stage, bgStage, city, world, position, worldPosition, id);
        this.maxArtifactsPerRow = 8;
    },
    addWindowInfoLines: function(){
        superClass.prototype.addWindowInfoLines.call(this);
        ARTIFACTS.discoverArtifacts(10, 10, true);
        // console.log(ARTIFACTS)
        let row = new gui_GUIContainer(this.city.gui, this.city.gui.innerWindowStage, this.city.gui.windowInner);
        let i = -1;
        for(const [id, artifact] of Object.entries(ARTIFACTS.a)){
            let artifactDisp = this.addArtifactDisplay(artifact);
            if(artifactDisp)
                i++;
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
        this.city.gui.windowInner.addChild(row);
        this.city.gui.windowInner.addChild(new gui_GUISpacing(this.city.gui.windowInner,new common_Point(2,10)));
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
}}, "spr_artifact_storage",
function(queue){

},
function(queue){

});

ModTools.makeBuilding("pixl_ArtifactHunters", (superClass) => { return {
    addWindowInfoLines: function() {
		var _gthis = this;
		buildings_WorkWithHome.prototype.addWindowInfoLines.call(this);
		this.city.gui.windowInner.addChild(new gui_GUISpacing(this.city.gui.window,new common_Point(4,4)));
		var anySQ = false;
		if(this.currentMission == 8) {
			anySQ = gui_CurrentMissionsWindow.displaySidequestsWithTag(this.city,this.city.gui,this.city.gui.innerWindowStage,this.city.gui.windowInner,"ArtifactHunters");
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
    missionGetTitle: function() {
		if(this.currentMission == 8) {
			return "Thank You";
		}
		return "Current Task";
	}
	,missionGetText: function() {
		if(this.currentMission >= 8) {
			return "We will be forever grateful.";
		}
		if(this.workers.length != this.get_jobs()) {
			return "We need more hunters!\nMake sure all 8 jobs are filled";
		}
		return common_Localize.lo("secret_society_mission_" + this.currentMission);
	},
    checkMissionCompletions: function() {
        
    },
    update: function(timeMod){
		superClass.prototype.update.call(this,timeMod);
    }
}}, "spr_artifact_hunters",
function(queue){

},
function(queue){

});

ARTIFACTS.registerArtifact("artifacts_base", "bonus_happiness", "Bonus Happiness", "spr_pixl_artifact_bonus_happiness",(a)=>{
    return "Adds 0.01 happiness per piece! Grants a bonus 0.5 happiness per tier above common!"
}, (a)=>{
    return "Currently adding " + (Math.floor((a.data.amount * 0.01 + a.tier * 0.5)*100)/100) + " bonus happiness!";
}, (a, amt, f)=>{}, false);

ARTIFACTS.registerArtifact("artifacts_base", "cheaper_buildings", "Cheaper Buildings", "spr_pixl_artifact_cheaper_building",(a)=>{
    return "Reduces the cost of buildings by 0.05% per piece! (Max 50% discount)"
}, (a)=>{
    return `Current reduction: ${(Math.min(1000, a.data.amount) * 0.05).toFixed(2)}%`;
}, (a, amt, f)=>{}, false);

ARTIFACTS.registerArtifact("artifacts_base", "cheaper_upgrades", "Cheaper Upgrades", "spr_pixl_artifact_cheaper_upgrades",(a)=>{
    return "Reduces the cost of building upgrades by 0.05% per piece! (Max 50% discount)"
}, (a)=>{
    return `Current reduction: ${(Math.min(1000, a.data.amount) * 0.05).toFixed(2)}%`;
}, (a, amt, f)=>{}, false);

ARTIFACTS.registerArtifact("artifacts_base", "faster_factories", "Faster Factories", "spr_pixl_artifact_faster_factories",(a)=>{
    return "Speeds up your factories by 0.001x per piece! (Max 2x speed)"
}, (a)=>{
    return `Current boost: +${(Math.min(1000, ARTIFACTS.a["artifacts_base::faster_factories"].data.amount) * 0.001).toFixed(2)}x`;
}, (a, amt, f)=>{}, false);

ARTIFACTS.registerArtifact("artifacts_base", "artifact_discovery_mult", "Higher Artifact Discovery Chance", "spr_pixl_artifact_higher_artifact_chance",(a)=>{
    return "Increase your artifact discovery chance by 0.1% per piece!"
}, (a)=>{
    return `Current boost: +${(a.data.amt * 0.001).toFixed(2)}%`;
}, (a, amt, f)=>{
    ARTIFACTS.discoveryMultipliers = amt * 0.001 + 1;
}, false);

ARTIFACTS.registerArtifact("artifacts_base", "supercomputer_output", "Supercomputer Output", "spr_pixl_artifact_double_supercomputer",(a)=>{
    return "Doubles the output of the supercomputer!"
}, (a)=>{
    return "";
}, (a, amt, f)=>{}, true);

ARTIFACTS.registerArtifact("artifacts_base", "machine_output", "Machine Output", "spr_pixl_artifact_double_machine",(a)=>{
    return "Doubles the output of the machine!"
}, (a)=>{
    return "";
}, (a, amt, f)=>{}, true);

ARTIFACTS.registerArtifact("artifacts_base", "rocket_fuel_cost", "Rocket Fuel Cost", "spr_pixl_artifact_cheaper_rocket_fuel",(a)=>{
    return "Halves the fuel cost of rocket missions!"
}, (a)=>{
    return "";
}, (a, amt, f)=>{}, true);

ARTIFACTS.registerArtifact("artifacts_base", "extra_housing", "Bigger Houses", "spr_pixl_artifact_bigger_houses",(a)=>{
    return "Adds one capacity to every house!"
}, (a)=>{
    return "";
}, (a, amt, f)=>{}, true);

ARTIFACTS.registerArtifact("artifacts_base", "bonus_housing_quality", "Fancier Houses", "spr_pixl_artifact_better_houses",(a)=>{
    return "Adds 10 housing quality to every house!"
}, (a)=>{
    return "";
}, (a, amt, f)=>{}, true);

let HAS_UPDATED_ARTIFACTS = true;

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
    buildings_WorkWithHome.prototype.get_residentCapacity = function() {
        return orig.call(this) + ARTIFACTS.a["artifacts_base::extra_housing"].data.amount;
    }
} (buildings_WorkWithHome.prototype.get_residentCapacity));

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
    worldResources_AlienRuins.prototype.awardAnyBonuses = function() {
        let tmp = this.bonusesAwarded;
        orig.call(this);
        if(tmp != this.bonusesAwarded){
            if(tmp == 0 || tmp == 2){
                let a = ARTIFACTS.getAllUniqueIds(false);
                if(a.length)
                    ARTIFACTS.discoverArtifacts(1, 1, null, a)
            }
        }
    }
} (worldResources_AlienRuins.prototype.awardAnyBonuses));