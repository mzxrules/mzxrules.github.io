class WarpMath {
    element: HTMLElement;
    input: HTMLInputElement;
    ul: HTMLUListElement;
    table: HTMLTableElement;
    tableBody: HTMLTableSectionElement
    resData: Array<SpawnResolution>;
    entData: Array<EntranceTable>;
    csCheckDefault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    csCheckParsed = [0, 1, 3];
    csCheck = this.csCheckDefault;

    constructor(element: HTMLElement, input: HTMLInputElement) {
        this.element = element;
        this.input = input;
        //this.ul = document.createElement('ul');
        //this.element.appendChild(this.ul);
        this.table = <HTMLTableElement>document.getElementById("warp-table"); //document.createElement('table');
        this.tableBody = <HTMLTableSectionElement>document.getElementById("warp-tbody");
        this.element.appendChild(this.table);
    }

    setResolutionData(d: Array<SpawnResolution>) {
        this.resData = d;
    }

    setEntranceData(d: Array<EntranceTable>) {
        this.entData = d;
    }

    getResolutionRecords(scene: number, spawn: number, cutscene: number) {
        let result = this.resData.filter(x => x.Scene == scene && x.Spawn == spawn && (x.Cs == cutscene || x.Cs == -1));
        //if (scene == 6 && spawn == 4)
        //    console.log(result);
        return result
    }


    getResolutionData(scene: number, spawn: number) {
        let results = this.resData.filter(x => x.Scene == scene && x.Spawn == spawn)
            .sort(function (a, b) {
                let x = b.Out - a.Out;
                return x == 0 ? a.Cs - b.Cs : x;
            });
        this.updateResults(results);
    }

    getDestinationResultsByScene(scene: number) {
        //lawd have mercy
        let base = this.entData.filter(x => x.Base == x.Index);
        let dest = this.entData.filter(x => x.Scene == scene);

        let result = new Array<StartEndResult>();
        base.forEach(x => {
            dest.forEach(y => {
                this.csCheck.forEach(cs => {
                    if (x.Base + cs + 4 == y.Index) {
                        let resolutionRecords = this.getResolutionRecords(y.Scene, y.Spawn, cs);
                        resolutionRecords.forEach(res => {
                            result.push(new StartEndResult(x, y, res, cs));
                        });
                    }
                });
            });
        });
        return result;
    }

    getStartResultsByScene(scene: number) {
        let base = this.entData.filter(x => x.Scene == scene && x.Base == x.Index);

        let result = new Array<StartEndResult>();
        base.forEach(x => {
            this.csCheck.forEach(cs => {
                let lookupIndex = x.Index + cs + 4;
                if (lookupIndex < 0x614) {
                    let entRec = this.entData[lookupIndex]; //(ent => ent.Index == x.Index + cs + 4);
                    let resolutionRecords = this.getResolutionRecords(entRec.Scene, entRec.Spawn, cs);
                    resolutionRecords.forEach(res => {
                        result.push(new StartEndResult(x, entRec, res, cs));
                    });
                }
            });
        });
        return result;
    }

    getEntranceRecord(index: number) {
        return this.entData.filter(x => x.Index == index)[0];
    }

    setDisplay(v: string) {
        this.element.innerHTML = v;
    }
    updateResults3(items: Array<StartEndResult>) {
        let tdsCur = <Array<HTMLTableDataCellElement>>[];
        while (this.tableBody.firstChild) {
            this.tableBody.removeChild(this.tableBody.firstChild);
        }

        for (let i = 0; i < 7; i++) {
            tdsCur.push(document.createElement('td'));
        }
        items.forEach(x => {
            let dSet = x.getWarpResultSet();
            let row = document.createElement('tr');
            this.tableBody.appendChild(row);

            for (let i = 0; i < 7; i++) {
                if (tdsCur[i].textContent != dSet[i]) {
                    let cell = <HTMLTableDataCellElement>document.createElement('td');
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
    }

    updateResults2(items: Array<StartEndResult>) {
        while (this.ul.firstChild) {
            this.ul.removeChild(this.ul.firstChild);
        }
        items.forEach(x => {
            var li = document.createElement('li');
            li.innerHTML = x.getWarpDescription();
            this.ul.appendChild(li);
        });
    }

    updateResults(items: Array<SpawnResolution>) {
        console.trace();
        while (this.ul.firstChild) {
            this.ul.removeChild(this.ul.firstChild);
        }
        items.forEach(x => {
            var li = document.createElement('li');
            li.innerHTML = this.formatSpawnResolution(x);
            this.ul.appendChild(li);
        });
    }

    formatSpawnResolution(x: SpawnResolution) {
        return `${x.Scene} ${x.Spawn} ${x.Cs} ${x.Fw} ${x.Out} ${x.Info}`;
        //return x.Scene.toString() + " " + x.Spawn.toString() + " " + x.Cs.toString() + " " + x.Fw + " " + x.Out + " " + x.Info;
    }

    getCutscenesToCheck() {
        let csInput = <string>$('#cutscene-input').val();
        let csList = <Array<number>>[];
        let strVal = csInput.split(',');
        let update = true;
        for (let i = 0; i < strVal.length; i++) {
            let str = strVal[i].trim();
            if (!$.isNumeric(str))
            {
                update = false;
                break;
            }
            else {
                let v = parseInt(str);
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
    }
    
    calculateWarps() {

        let e = <HTMLSelectElement>document.getElementById('selection');
        let i = parseInt((<HTMLOptionElement>e.options[e.selectedIndex]).value);
        if ($('.all-cutscene-input').is(':checked')) {
            this.csCheck = this.csCheckDefault;
        }
        else {
            this.csCheck = this.csCheckParsed;
        }
        let result = <Array<StartEndResult>>[];

        if ($('.lookup-input').is(':checked')) {
            result = this.getDestinationResultsByScene(i);
        }
        else {
            result = this.getStartResultsByScene(i);
        }

        //filter results by cutscene
        if ($('.crash-input').is(':checked')) {
            result = result.filter(x => x.Result.Out > 2);
        }

        //sort results
        result = result.sort(function (a, b) {
            let x = a.Start.Base - b.Start.Base;
            x = x == 0 ? (a.Cutscene - b.Cutscene) : x;
            return x;
        });

        this.updateResults3(result);

        //let i = parseInt(this.input.value);
        //let entRecord = wrongMath.getEntranceRecord(i);
        //wrongMath.getResolutionData(entRecord.Scene, entRecord.Spawn)
    }
}

class StartEndResult {
    Start: EntranceTable;
    End: EntranceTable;
    Result: SpawnResolution;
    Cutscene: number;

    constructor(start: EntranceTable,
        end: EntranceTable,
        result: SpawnResolution,
        cutscene: number) {
        this.Start = start;
        this.End = end;
        this.Result = result;
        this.Cutscene = cutscene;
    }

    getWarpResultSet() {
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
    }

    indexToStr(int: number) {
        let str = int.toString(16).toUpperCase();
        let pad = "0000";
        return pad.substring(0, pad.length - str.length) + str
    }

    padCs(int: number) {
        let str = int.toString();
        let pad = "00";
        return pad.substring(0, pad.length - str.length) + str
    }


    getWarpDescription() {
        if (this.Result == null)
            return "Error";

        return `${this.getEntranceFullDescription(this.Start)} will take you to ${this.getEntranceFullDescription(this.End)},
 and will ${this.getResolutionDescription(this.Result)}`;
    }

    getEntranceDescription(ent: EntranceTable) {
        if (ent.DestInfo === "")
            return ent.Dest;
        else
            return `${ent.Dest} ${ent.DestInfo}`;
    }

    getEntranceFullDescription(ent: EntranceTable) {
        return `${ent.Index.toString(16).toUpperCase()}: (${ent.Spawn}) ${this.getEntranceDescription(ent)}`;
    }
    getResolutionDescription(res: SpawnResolution) {
        let fwStr = res.Fw == 0 ? "" : (res.Fw == 1 ? " Without FW: " : " With FW: ");
        return `${fwStr}${res.Info}`;
    }
    getResolutionType(res: SpawnResolution) {
        return res.Out == 1 ? "Crash"
            : res.Out == 2 ? "Likely Crash"
                : res.Out == 3 ? "Cutscene Pointer"
                    : res.Out == 4 ? "Cutscene" : "Error";
    }
}

interface EntranceTable {
    Index: number;
    Base: number;
    Scene: number;
    Spawn: number;
    Dest: string;
    DestInfo: string;
}

interface SceneTable {
    Id: number;
    Scene: string;
}

interface SpawnResolution {
    Scene: number;
    Spawn: number;
    Cs: number;
    Fw: number;
    Out: number;
    Info: string;
}

declare var warpMath: any;
window.onload = () => {
    let el = document.getElementById('content');
    let input = <HTMLInputElement>document.getElementById('input');
    warpMath = new WarpMath(el, input);
    let wwMath = <WarpMath> warpMath;
    console.log(wwMath);

    $.when(
        $.getJSON("Scenes.json", function (r) {
            let selection = <HTMLSelectElement>document.getElementById('selection');
            (<Array<SceneTable>>r).forEach(x => {
                let option = <HTMLOptionElement>document.createElement('option');
                option.value = x.Id.toString();
                option.textContent = `${x.Scene} (${x.Id})`;
                selection.appendChild(option);
            });
        }),
        $.getJSON("SpawnResults.json", function (r) { wwMath.setResolutionData(r); }),
        $.getJSON("EntranceTable.json", function (r) { wwMath.setEntranceData(r); })
    ).done(x =>
    {
        let form = document.getElementById('test-input');
        let fieldset = <HTMLFieldSetElement>form.getElementsByTagName('fieldset')[0];
        fieldset.disabled = false;
        wwMath.calculateWarps();
    });
};
