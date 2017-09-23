var WarpMath = (function () {
    function WarpMath(element, input) {
        this.csCheckDefault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        this.csCheckParsed = [0, 1, 3];
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
    WarpMath.prototype.getResolutionRecords = function (scene, spawn, cutscene) {
        var result = this.resData.filter(function (x) { return x.Scene == scene && x.Spawn == spawn && (x.Cs == cutscene || x.Cs == -1); });
        //if (scene == 6 && spawn == 4)
        //    console.log(result);
        return result;
    };
    WarpMath.prototype.getResolutionData = function (scene, spawn) {
        var results = this.resData.filter(function (x) { return x.Scene == scene && x.Spawn == spawn; })
            .sort(function (a, b) {
            var x = b.Out - a.Out;
            return x == 0 ? a.Cs - b.Cs : x;
        });
        this.updateResults(results);
    };
    WarpMath.prototype.getDestinationResultsByScene = function (scene) {
        var _this = this;
        //lawd have mercy
        var base = this.entData.filter(function (x) { return x.Base == x.Index; });
        var dest = this.entData.filter(function (x) { return x.Scene == scene; });
        var result = new Array();
        base.forEach(function (x) {
            dest.forEach(function (y) {
                _this.csCheck.forEach(function (cs) {
                    if (x.Base + cs + 4 == y.Index) {
                        var resolutionRecords = _this.getResolutionRecords(y.Scene, y.Spawn, cs);
                        resolutionRecords.forEach(function (res) {
                            result.push(new StartEndResult(x, y, res, cs));
                        });
                    }
                });
            });
        });
        return result;
    };
    WarpMath.prototype.getStartResultsByScene = function (scene) {
        var _this = this;
        var base = this.entData.filter(function (x) { return x.Scene == scene && x.Base == x.Index; });
        //let start = this.entData.filter(x => x.Scene == scene);
        var result = new Array();
        base.forEach(function (x) {
            _this.csCheck.forEach(function (cs) {
                var lookupIndex = x.Index + cs + 4;
                if (lookupIndex < 0x614) {
                    var entRec_1 = _this.entData[lookupIndex]; //(ent => ent.Index == x.Index + cs + 4);
                    var resolutionRecords = _this.getResolutionRecords(entRec_1.Scene, entRec_1.Spawn, cs);
                    resolutionRecords.forEach(function (res) {
                        result.push(new StartEndResult(x, entRec_1, res, cs));
                    });
                }
            });
        });
        return result;
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
        return x.Scene + " " + x.Spawn + " " + x.Cs + " " + x.Fw + " " + x.Out + " " + x.Info;
        //return x.Scene.toString() + " " + x.Spawn.toString() + " " + x.Cs.toString() + " " + x.Fw + " " + x.Out + " " + x.Info;
    };
    WarpMath.prototype.getCutscenesToCheck = function () {
        var csInput = $('#cutscene-input').val();
        var csList = [];
        var strVal = csInput.split(',');
        var update = true;
        for (var i = 0; i < strVal.length; i++) {
            var str = strVal[i].trim();
            if (!$.isNumeric(str)) {
                update = false;
                break;
            }
            else {
                var v = parseInt(str);
                if ($.inArray(v, csList) == -1)
                    if ($.inArray(v, this.csCheckDefault) != -1)
                        csList.push(v);
            }
        }
        if (update == true) {
            this.csCheckParsed = csList.sort(function (a, b) { return a - b; });
        }
        if (!$('.all-cutscene-input').is(':checked')) {
            this.calculateWarps();
        }
    };
    WarpMath.prototype.calculateWarps = function () {
        var e = document.getElementById('selection');
        var i = parseInt(e.options[e.selectedIndex].value);
        if ($('.all-cutscene-input').is(':checked')) {
            this.csCheck = this.csCheckDefault;
        }
        else {
            this.csCheck = this.csCheckParsed;
        }
        var result;
        if ($('.lookup-input').is(':checked')) {
            result = this.getDestinationResultsByScene(i);
        }
        else {
            result = this.getStartResultsByScene(i);
        }
        //sort results
        result = result.sort(function (a, b) {
            var x = a.Start.Base - b.Start.Base;
            x = x == 0 ? (a.Result.Cs - b.Result.Cs) : x;
            return x;
        });
        //filter results by cutscene
        if ($('.crash-input').is(':checked')) {
            result = result.filter(function (x) { return x.Result.Out > 2; });
        }
        this.updateResults3(result);
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
            this.indexToStr(this.Start.Index),
            this.getEntranceDescription(this.Start),
            this.indexToStr(this.End.Index),
            this.getEntranceDescription(this.End),
            this.padCs(this.Cutscene),
            this.getResolutionType(this.Result),
            this.getResolutionDescription(this.Result)
        ];
    };
    StartEndResult.prototype.indexToStr = function (int) {
        var str = int.toString(16).toUpperCase();
        var pad = "0000";
        return pad.substring(0, pad.length - str.length) + str;
    };
    StartEndResult.prototype.padCs = function (int) {
        var str = int.toString();
        var pad = "00";
        return pad.substring(0, pad.length - str.length) + str;
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
        var fwStr = res.Fw == 0 ? "" : (res.Fw == 1 ? " Without FW: " : " With FW: ");
        return "" + fwStr + res.Info;
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
    var wwMath = warpMath;
    console.log(wwMath);
    $.when($.getJSON("Scenes.json", function (r) {
        var selection = document.getElementById('selection');
        r.forEach(function (x) {
            var option = document.createElement('option');
            option.value = x.Id.toString();
            option.textContent = x.Scene + " (" + x.Id + ")";
            selection.appendChild(option);
        });
    }), $.getJSON("SpawnResults.json", function (r) { wwMath.setResolutionData(r); }), $.getJSON("EntranceTable.json", function (r) { wwMath.setEntranceData(r); })).done(function (x) {
        var form = document.getElementById('test-input');
        var fieldset = form.getElementsByTagName('fieldset')[0];
        fieldset.disabled = false;
        wwMath.calculateWarps();
    });
};
//# sourceMappingURL=app.js.map