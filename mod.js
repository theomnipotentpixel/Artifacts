let ARTIFACTS = {a:{}};
let A_M = {};
//                                   string,   string,     string,                string,         function(ARTIFACTS, thisArtifact), function(ARTIFACTS, thisArtifact), function(ARTIFACTS, thisArtifact, newAmount, isFirst)
ARTIFACTS.registerArtifact = function(modName, artifactName, artifactDisplayName, artifactSprite, artifactDescription, artifactCurrentEffectText, onAmountChange){
    ARTIFACTS.a[modName + "::" + artifactName] = {
        id: modName + "::" + artifactName,
        displayName: artifactDisplayName,
        description: artifactDescription,
        currentEffect: artifactCurrentEffectText,
        onChange: onAmountChange,
        spr: artifactSprite,
        data: {
            amount: 0,
            discoveredPrior: false
        }
    }
    ARTIFACTS.a[modName + "::" + artifactName].getDescription = function(){return ARTIFACTS.a[modName + "::" + artifactName].description(ARTIFACTS, ARTIFACTS.a[modName + "::" + artifactName])}
    ARTIFACTS.a[modName + "::" + artifactName].getCurrentEffectText = function(){return ARTIFACTS.a[modName + "::" + artifactName].currentEffect(ARTIFACTS, ARTIFACTS.a[modName + "::" + artifactName])}
}

ARTIFACTS.gainOrLoseArtifactAmount = function(modName, artifactName, amount){
    let id = modName + "::" + artifactName;
    amount = Math.trunc(amount);
    if(ARTIFACTS.a[id]){
        let isFirst = false;
        if(amount > 0 && !ARTIFACTS.a[id].data.discoveredPrior){
            isFirst = true;
            ARTIFACTS.a[id].data.discoveredPrior = true;
        }
        ARTIFACTS.a[id].data.amount += amount;
        if(ARTIFACTS.a[id].data.amount < 0)
            ARTIFACTS.a[id].data.amount = 0;
        ARTIFACTS.a[id].onChange(ARTIFACTS, ARTIFACTS.a[id], ARTIFACTS.a[id].data.amount, isFirst)
    } else {
        console.warn(`WARN: Attempted to edit artifact count of artifact "${id}", but artifact has not been registered! (ARTIFACTS.gainOrLoseArtifactAmount)`);
    }
}

ARTIFACTS.setArtifactAmount = function(modName, artifactName, amount){
    let id = modName + "::" + artifactName;
    amount = Math.max(Math.trunc(amount), 0);
    if(ARTIFACTS.a[id]){
        let isFirst = false;
        if(amount > 0 && !ARTIFACTS.a[id].data.discoveredPrior){
            isFirst = true;
            ARTIFACTS.a[id].data.discoveredPrior = true;
        }
        ARTIFACTS.a[id].data.amount = amount;
        ARTIFACTS.a[id].onChange(ARTIFACTS, ARTIFACTS.a[id], ARTIFACTS.a[id].amount, isFirst)
    } else {
        console.warn(`WARN: Attempted to edit artifact count of artifact "${id}", but artifact has not been registered! (ARTIFACTS.setArtifactAmount)`);
    }
}

ModTools.makeBuilding("pixl_ArtifactGallery", (superClass) => { return {
    __constructor__: function(game, stage, bgStage, city, world, position, worldPosition, id){
        superClass.call(this, game, stage, bgStage, city, world, position, worldPosition, id);
        this.progress = -0.05
    },
    addWindowInfoLines: function(){
        superClass.prototype.addWindowInfoLines.call(this);
        console.log(ARTIFACTS.a)
        for(const [id, artifact] of Object.entries(ARTIFACTS.a)){
            artifact.data.amount++;
            console.log(artifact);
            this.addArtifactDisplay(artifact);
        }
        this.city.gui.windowInner.addChild(new gui_GUISpacing(this.city.gui.windowInner,new common_Point(2,10)));
    },
    addArtifactDisplay: function(artifact){
        // let container = new gui_GUIContainer(this.city.gui, this.city.gui.innerWindowStage, this.city.gui.windowInner)

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
        this.progress += 0.05;
        this.progress = Math.min(this.progress, 1);
        let _this = this;
        let col = ((255 - Math.round(this.progress * 255)) << 16) +
            ((Math.round(this.progress * 255)) << 8);

        let upgradeProgressBar = new gui_ContainerButtonWithProgress(this.city.gui, this.city.gui.innerWindowStage, this.city.gui.windowInner, ()=>{}, ()=>{return true},
        ()=>{
            _this.city.gui.tooltip.setText(this.city.gui.windowInner, `${artifact.data.amount} / 100`)
        }, "spr_button", 10526880, col, ()=>{return _this.progress}
        );
        upgradeProgressBar.padding = { left : 2, right : 3, top : 2, bottom : 1}
        upgradeProgressBar.container.addChild(new gui_ContainerHolder(upgradeProgressBar.container,this.city.gui.innerWindowStage,new PIXI.Sprite(texture), { left : 0, right : 0, top : 0, bottom : 0}));
        this.city.gui.windowInner.addChild(upgradeProgressBar);
        
    }
}}, "spr_artifact_storage",
function(queue){

},
function(queue){

});

ARTIFACTS.registerArtifact("artifacts_base", "test", "Test", "spr_pixl_artifact_unknown",(artifacts, a)=>{return "desc" + a.amount}, (artifacts, a)=>{return "effect" + a.amount}, (artifacts, a, amt, f)=>{console.log(amt, f)});

ModTools.addSaveData("pixl::artifacts",
function(city, queue, version){
    let t = {};
    for (const [k, v] of Object.entries(ARTIFACTS.a)) {
        t[k] = v.data
    }
    console.log(t);
    queue.addString(JSON.stringify(t));
},
function(city, queue, version){
    A_M = JSON.parse(queue.readString());
    console.log(A_M);
}, 0);

ModTools.onCityCreate(function(){
    for (const [k, v] of Object.entries(A_M)) {
        ARTIFACTS.a[k].data = v.data;
    }
    console.log(JSON.stringify(ARTIFACTS.a));
});