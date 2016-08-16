class Greeter {
    element: HTMLElement;
    span: HTMLElement;
    timerToken: number;

    constructor(element: HTMLElement) {
        this.element = element;
        this.element.innerHTML += "The time is: ";
        this.span = document.createElement('span');
        this.element.appendChild(this.span);
        this.span.innerText = new Date().toUTCString();
    }

    start() {
        this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500);
    }

    stop() {
        clearTimeout(this.timerToken);
    }

}

class WarpMath {
    element: HTMLElement;
    ul: HTMLUListElement;
    resData: Array<SpawnResolution>;
    entData: Array<EntranceTable>;
    csCheckDefault = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    csCheck = this.csCheckDefault;

    constructor(element: HTMLElement) {
        this.element = element;
        this.ul = document.createElement('ul');
        this.element.appendChild(this.ul);
    }

    setResolutionData(d: Array<SpawnResolution>) {
        this.resData = d;
    }

    setEntranceData(d: Array<EntranceTable>) {
        this.entData = d;
    }

    getResolutionRecord(scene: number, spawn: number, cutscene: number) {
        return this.resData.filter(x => x.Scene == scene && x.Spawn == x.Spawn && (x.Cs == cutscene || x.Cs == -1))[0];
    }


    getResolutionData(scene: number, spawn: number) {
        let results = this.resData.filter(x => x.Scene == scene && x.Spawn == spawn)
            .sort(function (a, b) {
                let x = b.Out - a.Out;
                return x == 0 ? a.Cs - b.Cs : x;
            });
        this.updateResults(results);
    }

    getResultsByScene(scene: number) {
        //lawd have mercy
        let base = this.entData.filter(x => x.Base == x.Index);
        let dest = this.entData.filter(x => x.Scene == scene);

        let result = new Array<StartEndResult>();
        base.forEach(x => {
            dest.forEach(y => {
                this.csCheck.forEach(cs => {
                    if (x.Base + cs + 4 == y.Index) {
                        result.push(new StartEndResult(x, y, this.getResolutionRecord(y.Scene, y.Spawn, cs), cs));
                    }
                });
            });
        });

        result = result.sort(function (a, b) {
            let x = b.Result.Out - a.Result.Out;
            return x == 0 ? a.Result.Cs - b.Result.Cs : x;
        });

        this.updateResults2(result);
    }

    getEntranceRecord(index: number) {
        return this.entData.filter(x => x.Index == index)[0];
    }

    setDisplay(v: string) {
        this.element.innerHTML = v;
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

    formatSpawnResolution(x: SpawnResolution)
    {
        return x.Scene.toString() + " " + x.Spawn.toString() + " " + x.Cs.toString() + " " + x.Fw + " " + x.Out + " " + x.Info;
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

    getWarpDescription() {
        if (this.Result == null)
            return "Error";

        return `${this.getEntranceDescription(this.Start)} will take you to ${this.getEntranceDescription(this.End)},
 and will ${this.getResolutionDescription(this.Result)}`;
    }
    getEntranceDescription(ent: EntranceTable) {
        if (ent.DestInfo === "")
            return `${ent.Index.toString(16)}: (${ent.Spawn}) ${ent.Dest}`;
        else
            return `${ent.Index.toString(16)}: (${ent.Spawn}) ${ent.Dest} from ${ent.DestInfo}`;
    }
    getResolutionDescription(res: SpawnResolution) {
        let fwStr = res.Fw == 0 ? "" : res.Fw == 1 ? " With Farore's Wind" : " Without Farore's Wind";
        let resResult = res.Out == 1 ? "Crash" : res.Out == 2 ? "Likely Crash" : res.Out == 3 ? "Cutscene Pointer" : res.Out == 4 ? "Cutscene" : "Error";
        return `${resResult}${fwStr}: ${res.Info}`;
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
    let greeter = new Greeter(el);
    let testEl = document.getElementById('test');
    warpMath = new WarpMath(testEl);
    warpMath.csCheck = [0, 1, 3];


    let wwMath = <WarpMath> warpMath;
    console.log(wwMath);

    $.when(
        $.getJSON("SpawnResults.json", function (r) { wwMath.setResolutionData(r); }),
        $.getJSON("EntranceTable.json", function (r) { wwMath.setEntranceData(r); })
    ).done(x =>
    {
        let form = document.getElementById('test-input');
        let fieldset = <HTMLFieldSetElement>form.getElementsByTagName('fieldset')[0];
        fieldset.disabled = false;
    });
    
    greeter.start();
};

function calculateWarps() {
    let input = <HTMLInputElement>document.getElementById('input');
    let i = parseInt(input.value);
    let wrongMath = <WarpMath>warpMath;
    wrongMath.getResultsByScene(i);

    //let entRecord = wrongMath.getEntranceRecord(i);
    //wrongMath.getResolutionData(entRecord.Scene, entRecord.Spawn)
}