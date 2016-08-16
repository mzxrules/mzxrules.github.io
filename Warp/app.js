var Greeter = (function () {
    function Greeter(element) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement('span');
        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }
    Greeter.prototype.start = function () {
        var _this = this;
        this.timerToken = setInterval(function () { return _this.span.innerHTML = new Date().toUTCString(); }, 500);
    };
    Greeter.prototype.stop = function () {
        clearTimeout(this.timerToken);
    };
    return Greeter;
}());
var WarpMath = (function () {
    function WarpMath(element) {
        this.csCheckDefault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this.csCheck = this.csCheckDefault;
        this.element = element;
        this.ul = document.createElement('ul');
        this.element.appendChild(this.ul);
    }
    WarpMath.prototype.setResolutionData = function (d) {
        this.resData = d;
    };
    WarpMath.prototype.setEntranceData = function (d) {
        this.entData = d;
    };
    WarpMath.prototype.getResolutionRecord = function (scene, spawn, cutscene) {
        return this.resData.filter(function (x) { return x.Scene == scene && x.Spawn == x.Spawn && (x.Cs == cutscene || x.Cs == -1); })[0];
    };
    WarpMath.prototype.getResolutionData = function (scene, spawn) {
        var results = this.resData.filter(function (x) { return x.Scene == scene && x.Spawn == spawn; })
            .sort(function (a, b) {
            var x = b.Out - a.Out;
            return x == 0 ? a.Cs - b.Cs : x;
        });
        this.updateResults(results);
    };
    WarpMath.prototype.getResultsByScene = function (scene) {
        var _this = this;
        //lawd have mercy
        var base = this.entData.filter(function (x) { return x.Base == x.Index; });
        var dest = this.entData.filter(function (x) { return x.Scene == scene; });
        var result = new Array();
        base.forEach(function (x) {
            dest.forEach(function (y) {
                _this.csCheck.forEach(function (cs) {
                    if (x.Base + cs + 4 == y.Index) {
                        result.push(new StartEndResult(x, y, _this.getResolutionRecord(y.Scene, y.Spawn, cs), cs));
                    }
                });
            });
        });
        result = result.sort(function (a, b) {
            var x = b.Result.Out - a.Result.Out;
            return x == 0 ? a.Result.Cs - b.Result.Cs : x;
        });
        this.updateResults2(result);
    };
    WarpMath.prototype.getEntranceRecord = function (index) {
        return this.entData.filter(function (x) { return x.Index == index; })[0];
    };
    WarpMath.prototype.setDisplay = function (v) {
        this.element.innerHTML = v;
    };
    WarpMath.prototype.updateResults2 = function (items) {
        var _this = this;
        while (this.ul.firstChild) {
            this.ul.removeChild(this.ul.firstChild);
        }
        items.forEach(function (x) {
            var li = document.createElement('li');
            li.innerHTML = x.getWarpDescription();
            _this.ul.appendChild(li);
        });
    };
    WarpMath.prototype.updateResults = function (items) {
        var _this = this;
        console.trace();
        while (this.ul.firstChild) {
            this.ul.removeChild(this.ul.firstChild);
        }
        items.forEach(function (x) {
            var li = document.createElement('li');
            li.innerHTML = _this.formatSpawnResolution(x);
            _this.ul.appendChild(li);
        });
    };
    WarpMath.prototype.formatSpawnResolution = function (x) {
        return x.Scene.toString() + " " + x.Spawn.toString() + " " + x.Cs.toString() + " " + x.Fw + " " + x.Out + " " + x.Info;
    };
    return WarpMath;
}());
var StartEndResult = (function () {
    function StartEndResult(start, end, result, cutscene) {
        this.Start = start;
        this.End = end;
        this.Result = result;
        this.Cutscene = cutscene;
    }
    StartEndResult.prototype.getWarpDescription = function () {
        if (this.Result == null)
            return "Error";
        return this.getEntranceDescription(this.Start) + " will take you to " + this.getEntranceDescription(this.End) + ",\n and will " + this.getResolutionDescription(this.Result);
    };
    StartEndResult.prototype.getEntranceDescription = function (ent) {
        if (ent.DestInfo === "")
            return ent.Index.toString(16) + ": (" + ent.Spawn + ") " + ent.Dest;
        else
            return ent.Index.toString(16) + ": (" + ent.Spawn + ") " + ent.Dest + " from " + ent.DestInfo;
    };
    StartEndResult.prototype.getResolutionDescription = function (res) {
        var fwStr = res.Fw == 0 ? "" : res.Fw == 1 ? " With Farore's Wind" : " Without Farore's Wind";
        var resResult = res.Out == 1 ? "Crash" : res.Out == 2 ? "Likely Crash" : res.Out == 3 ? "Cutscene Pointer" : res.Out == 4 ? "Cutscene" : "Error";
        return "" + resResult + fwStr + ": " + res.Info;
    };
    return StartEndResult;
}());
window.onload = function () {
    var el = document.getElementById('content');
    var greeter = new Greeter(el);
    var testEl = document.getElementById('test');
    warpMath = new WarpMath(testEl);
    warpMath.csCheck = [0, 1, 3];
    var wwMath = warpMath;
    console.log(wwMath);
    $.when($.getJSON("SpawnResults.json", function (r) { wwMath.setResolutionData(r); }), $.getJSON("EntranceTable.json", function (r) { wwMath.setEntranceData(r); })).done(function (x) {
        var form = document.getElementById('test-input');
        var fieldset = form.getElementsByTagName('fieldset')[0];
        fieldset.disabled = false;
    });
    greeter.start();
};
function calculateWarps() {
    var input = document.getElementById('input');
    var i = parseInt(input.value);
    var wrongMath = warpMath;
    wrongMath.getResultsByScene(i);
    //let entRecord = wrongMath.getEntranceRecord(i);
    //wrongMath.getResolutionData(entRecord.Scene, entRecord.Spawn)
}
//# sourceMappingURL=app.js.map