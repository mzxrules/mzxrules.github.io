var WarpMath = (function () {
    function WarpMath(element, input) {
        this.csCheckDefault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this.csCheck = this.csCheckDefault;
        this.element = element;
        this.input = input;
        //this.ul = document.createElement('ul');
        //this.element.appendChild(this.ul);
        this.table = document.getElementById("warp-table"); //document.createElement('table');
        this.tableBody = document.getElementById("warp-tbody");
        this.element.appendChild(this.table);
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
        console.log("comp start");
        result = result.sort(function (a, b) {
            var x = a.Start.Base - b.Start.Base;
            x = x == 0 ? (a.Result.Cs - b.Result.Cs) : x;
            return x;
        });
        this.updateResults3(result);
    };
    WarpMath.prototype.getEntranceRecord = function (index) {
        return this.entData.filter(function (x) { return x.Index == index; })[0];
    };
    WarpMath.prototype.setDisplay = function (v) {
        this.element.innerHTML = v;
    };
    WarpMath.prototype.updateResults3 = function (items) {
        var _this = this;
        var tdsCur = [];
        while (this.tableBody.firstChild) {
            this.tableBody.removeChild(this.tableBody.firstChild);
        }
        {
            var row = document.createElement('tr');
        }
        for (var i = 0; i < 7; i++) {
            tdsCur.push(document.createElement('td'));
        }
        items.forEach(function (x) {
            var dSet = x.getWarpResultSet();
            var row = document.createElement('tr');
            _this.tableBody.appendChild(row);
            for (var i = 0; i < 7; i++) {
                if (tdsCur[i].textContent != dSet[i]) {
                    var cell = document.createElement('td');
                    cell.textContent = dSet[i];
                    row.appendChild(cell);
                    tdsCur[i] = cell;
                }
                else {
                    tdsCur[i].rowSpan++;
                }
            }
        });
        this.table.style.visibility = "visible";
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
    WarpMath.prototype.calculateWarps = function () {
        var e = document.getElementById('selection');
        var i = parseInt(e.options[e.selectedIndex].value);
        this.getResultsByScene(i);
        //let i = parseInt(this.input.value);
        //let entRecord = wrongMath.getEntranceRecord(i);
        //wrongMath.getResolutionData(entRecord.Scene, entRecord.Spawn)
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
    StartEndResult.prototype.getWarpResultSet = function () {
        if (this.Result == null)
            return ["Error"];
        return [
            this.Start.Index.toString(16).toUpperCase(),
            this.getEntranceDescription(this.Start),
            this.End.Index.toString(16).toUpperCase(),
            this.getEntranceDescription(this.End),
            this.Cutscene.toString(),
            this.Result.Out.toString(),
            this.getResolutionDescription(this.Result)
        ];
    };
    StartEndResult.prototype.getWarpDescription = function () {
        if (this.Result == null)
            return "Error";
        return this.getEntranceFullDescription(this.Start) + " will take you to " + this.getEntranceFullDescription(this.End) + ",\n and will " + this.getResolutionDescription(this.Result);
    };
    StartEndResult.prototype.getEntranceDescription = function (ent) {
        if (ent.DestInfo === "")
            return ent.Dest;
        else
            return ent.Dest + " " + ent.DestInfo;
    };
    StartEndResult.prototype.getEntranceFullDescription = function (ent) {
        return ent.Index.toString(16).toUpperCase() + ": (" + ent.Spawn + ") " + this.getEntranceDescription(ent);
    };
    StartEndResult.prototype.getResolutionDescription = function (res) {
        var fwStr = res.Fw == 0 ? "" : (res.Fw == 1 ? " With Farore's Wind" : " Without Farore's Wind");
        return "" + this.getResolutionType(res) + fwStr + ": " + res.Info;
    };
    StartEndResult.prototype.getResolutionType = function (res) {
        return res.Out == 1 ? "Crash"
            : res.Out == 2 ? "Likely Crash"
                : res.Out == 3 ? "Cutscene Pointer"
                    : res.Out == 4 ? "Cutscene" : "Error";
    };
    return StartEndResult;
}());
window.onload = function () {
    var el = document.getElementById('content');
    var input = document.getElementById('input');
    warpMath = new WarpMath(el, input);
    warpMath.csCheck = [0, 1, 3];
    var wwMath = warpMath;
    console.log(wwMath);
    $.when($.getJSON("SpawnResults.json", function (r) { wwMath.setResolutionData(r); }), $.getJSON("EntranceTable.json", function (r) { wwMath.setEntranceData(r); }), $.getJSON("Scenes.json", function (r) {
        var selection = document.getElementById('selection');
        r.forEach(function (x) {
            var option = document.createElement('option');
            option.value = x.Id.toString();
            option.textContent = x.Scene + " (" + x.Id + ")";
            selection.appendChild(option);
        });
    })).done(function (x) {
        var form = document.getElementById('test-input');
        var fieldset = form.getElementsByTagName('fieldset')[0];
        fieldset.disabled = false;
        wwMath.calculateWarps();
    });
};
//# sourceMappingURL=app.js.map