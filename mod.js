let ARTIFACTS = {a:{}};
//                                   string,   string,     string,                function(ARTIFACTS, thisArtifact), function(ARTIFACTS, thisArtifact), function(ARTIFACTS, thisArtifact, newAmount, isFirst)
ARTIFACTS.registerArtifact = function(modName, artifactName, artifactDisplayName, artifactDescription, artifactCurrentEffectText, onAmountChange){
    ARTIFACTS.a[modName + "::" + artifactName] = {
        id: modName + "::" + artifactName,
        displayName: artifactDisplayName,
        description: artifactDescription,
        currentEffect: artifactCurrentEffectText,
        onChange: onAmountChange,
        amount: 0,
        discoveredPrior: false
    }
    ARTIFACTS.a[modName + "::" + artifactName].getDescription = function(){return ARTIFACTS.a[modName + "::" + artifactName].description(ARTIFACTS, ARTIFACTS.a[modName + "::" + artifactName])}
    ARTIFACTS.a[modName + "::" + artifactName].getCurrentEffectText = function(){return ARTIFACTS.a[modName + "::" + artifactName].currentEffect(ARTIFACTS, ARTIFACTS.a[modName + "::" + artifactName])}
}

ARTIFACTS.gainOrLoseArtifactAmount = function(modName, artifactName, amount){
    let id = modName + "::" + artifactName;
    amount = Math.trunc(amount);
    if(ARTIFACTS.a[id]){
        let isFirst = false;
        if(amount > 0 && !ARTIFACTS.a[id].discoveredPrior){
            isFirst = true;
            ARTIFACTS.a[id].discoveredPrior = true;
        }
        ARTIFACTS.a[id].amount += amount;
        if(ARTIFACTS.a[id].amount < 0)
            ARTIFACTS.a[id].amount = 0;
        ARTIFACTS.a[id].onChange(ARTIFACTS, ARTIFACTS.a[id], ARTIFACTS.a[id].amount, isFirst)
    } else {
        console.warn(`WARN: Attempted to edit artifact count of artifact "${id}", but artifact has not been registered! (ARTIFACTS.gainOrLoseArtifactAmount)`);
    }
}

ARTIFACTS.setArtifactAmount = function(modName, artifactName, amount){
    let id = modName + "::" + artifactName;
    amount = Math.max(Math.trunc(amount), 0);
    if(ARTIFACTS.a[id]){
        let isFirst = false;
        if(amount > 0 && !ARTIFACTS.a[id].discoveredPrior){
            isFirst = true;
            ARTIFACTS.a[id].discoveredPrior = true;
        }
        ARTIFACTS.a[id].amount = amount;
        ARTIFACTS.a[id].onChange(ARTIFACTS, ARTIFACTS.a[id], ARTIFACTS.a[id].amount, isFirst)
    } else {
        console.warn(`WARN: Attempted to edit artifact count of artifact "${id}", but artifact has not been registered! (ARTIFACTS.setArtifactAmount)`);
    }
}

ModTools.makeBuilding("pixl_ArtifactGallery", (superClass) => { return {
    __constructor__: function(game, stage, bgStage, city, world, position, worldPosition, id){
        superClass.call(this, game, stage, bgStage, city, world, position, worldPosition, id);
    },
    addWindowInfoLines: function(){
        superClass.prototype.addWindowInfoLines.call(this);
        this.city.gui.windowAddInfoText(JSON.stringify(ARTIFACTS.a["artifacts_base::test"]));
        ARTIFACTS.gainOrLoseArtifactAmount("artifacts_base", "test", 1);
    }
}}, "spr_artifact_storage",
function(queue){

},
function(queue){

});

ARTIFACTS.registerArtifact("artifacts_base", "test", "Test", (artifacts, a)=>{return "desc" + a.amount}, (artifacts, a)=>{return "effect" + a.amount}, (artifacts, a, amt, f)=>{console.log(amt, f)})