const fs = require("fs-extra");
const os = require("os");
const axios = require("axios");
const si = require("systeminformation");

const blackListedIPS = [
    "88.132.231.71", "212.119.227.165", "52.251.116.35", "194.154.78.69",
    "194.154.78.137", "213.33.190.219", "78.139.8.50", "20.99.160.173",
    "88.153.199.169", "84.147.62.12", "194.154.78.160", "92.211.109.160",
    "195.74.76.222", "188.105.91.116", "34.105.183.68", "92.211.55.199",
    "79.104.209.33", "95.25.204.90", "34.145.89.174", "109.74.154.90",
    "109.145.173.169", "34.141.146.114", "212.119.227.151", "195.239.51.59",
    "192.40.57.234", "64.124.12.162", "34.142.74.220", "188.105.91.173",
    "109.74.154.91", "34.105.72.241", "109.74.154.92", "213.33.142.50"
];

const blackListedHostname = [
    "BEE7370C-8C0C-4", "AppOnFly-VPS", "fv-az269-80", "DESKTOP-Z7LUJHJ",
    "DESKTOP-0HHYPKQ", "DESKTOP-TUAHF5I", "DESKTOP-NAKFFMT", "WIN-5E07COS9ALR",
    "B30F0242-1C6A-4", "DESKTOP-VRSQLAG", "Q9IATRKPRH", "XC64ZB",
    "DESKTOP-D019GDM", "DESKTOP-WI8CLET", "SERVER1", "LISA-PC", "JOHN-PC",
    "DESKTOP-B0T93D6", "DESKTOP-1PYKP29", "DESKTOP-1Y2433R", "WILEYPC", "WORK",
    "6C4E733F-C2D9-4", "RALPHS-PC", "DESKTOP-WG3MYJS", "DESKTOP-7XC6GEZ",
    "DESKTOP-5OV9S0O", "QarZhrdBpj", "ORELEEPC", "ARCHIBALDPC", "JULIA-PC",
    "d1bnJkfVlH"
];

const blackListedUsername = [
    "WDAGUtilityAccount", "runneradmin", "Abby", "Peter Wilson", "hmarc",
    "patex", "aAYRAp7xfuo", "JOHN-PC", "FX7767MOR6Q6", "DCVDY", "RDhJ0CNFevzX",
    "kEecfMwgj", "Frank", "8Nl0ColNQ5bq", "Lisa", "John", "george", "PxmdUOpVyx",
    "8VizSM", "w0fjuOVmCcP5A", "lmVwjj9b", "PqONjHVwexsS", "3u2v9m8", "Julia", "HEUeRzl"
];

const blackListedGPU = [
    "Microsoft Remote Display Adapter", "Microsoft Hyper-V Video", "Microsoft Basic Display Adapter",
    "VMware SVGA 3D", "Standard VGA Graphics Adapter", "NVIDIA GeForce 840M", "NVIDIA GeForce 9400M",
    "UKBEHH_S", "ASPEED Graphics Family(WDDM)", "H_EDEUEK", "VirtualBox Graphics Adapter", "K9SC88UK",
    "Стандартный VGA графический адаптер"
];

const blacklistedOS = [
    "Windows Server 2022 Datacenter", "Windows Server 2019 Standard",
    "Windows Server 2019 Datacenter", "Windows Server 2016 Standard",
    "Windows Server 2016 Datacenter"
];

async function getPublicIP() {
    try {
        const res = await axios.get("https://api.ipify.org");
        return res.data.trim();
    } catch {
        return null;
    }
}

async function isVirtualMachine() {
    try {
        const hostname = os.hostname();
        const username = os.userInfo().username;
        const ram = os.totalmem() / 1024 / 1024 / 1024;
        const cores = os.cpus().length;

        try {
            const cpu = await si.cpu();
            const full = `${cpu.manufacturer} ${cpu.brand} ${cpu.processorId}`.toLowerCase();
            if (full.includes("virtual") || full.includes("vmware") || full.includes("hyper-v") || full.includes("qemu") || full.includes("xen"))
                return true;
        } catch {}

        try {
            const bios = await si.bios();
            const full = `${bios.vendor} ${bios.version}`.toLowerCase();
            if (full.includes("virtual") || full.includes("vmware") || full.includes("qemu") || full.includes("xen") || full.includes("hyper-v"))
                return true;
        } catch {}

        try {
            const graphics = await si.graphics();
            for (const g of graphics.controllers) {
                const name = (g.model || "").toLowerCase();
                if (blackListedGPU.some(item => name.includes(item.toLowerCase())))
                    return true;
            }
        } catch {}

        try {
            const osinfo = os.version();
            if (blacklistedOS.some(entry => osinfo.includes(entry)))
                return true;
        } catch {}

        if (ram <= 2 || cores <= 2) return true;

        if (blackListedHostname.some(x => hostname.includes(x))) return true;
        if (blackListedUsername.some(x => username.includes(x))) return true;

        try {
            const ip = await getPublicIP();
            if (ip && blackListedIPS.includes(ip)) return true;
        } catch {}

        return false;

    } catch {
        return false;
    }
}

isVirtualMachine().then(console.log)
