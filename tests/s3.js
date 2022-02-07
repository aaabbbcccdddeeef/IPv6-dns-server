var assert = require('assert');
 
function check_for_s3_hostname(hostname) {
    if (!hostname) return false;
    var sdomains = hostname.split(".");
    sdomains.reverse();
    //console.log(sdomains);

    var dp1 = sdomains.indexOf("cn");

    //matched china region, remove it thinking it does not exist
    if (dp1 == 0) sdomains.splice(0, 1);

    var dp2 = sdomains.indexOf("amazonaws");
    var dp3 = sdomains.indexOf("s3");
    var dp4 = sdomains.indexOf("s3-control");
    var dp5 = sdomains.indexOf("s3-w");
    var dp6 = sdomains.indexOf("s3-accelerate");
    var dp7 = sdomains.indexOf("s3-accesspoint");
    var dp8 = sdomains.indexOf("s3-website");

    if (dp2 == 1) {
        //console.log(hostname+" amazon matched");		
        var ssdomains = sdomains[2].split("-");
        if (sdomains.length == 5) sdomains[5] = sdomains[4];
        //console.log(ssdomains);

        if (dp6 === 2) { //matched s3-accelerate domains
            //sdomains.splice(2, 0, "s3-accelerate");
			sdomains.splice(2, 0, "dualstack");
            dp1 = -1 //break china domain match
            //console.log(sdomains);
            //console.log("s3 matched 1");
        } else if (dp7 === 3) { //matched s3-accesspoint domains
            sdomains.splice(4, 1);
            //console.log("s3 matched 7");
        } else if (dp8 === 3) { //matched s3-website domains
            sdomains.splice(4, 1);
            dp1 = -1 //break china domain match
            //console.log("s3 matched 8");
        } else if (ssdomains[0] === 's3' && ssdomains[1] === '1' && dp1 !== 0) { //matched  s3-1-w.amazonaws.com or s3-1.amazonaws.com
            sdomains.splice(2, 0, "us-east-1");
            sdomains.splice(4, 0, "s3");
            //console.log("s3 matched 2");
        } else if (dp3 === 3 || dp4 === 3) {
            sdomains.splice(4, 1);
            //console.log("s3 matched 3");
        } else if (dp5 === 3) {
            sdomains.splice(4, 0, "s3-w");
            //console.log("s3 matched 4");
        } else if (ssdomains[0] === 's3' && ssdomains[1] === 'website') { //matched s3-website-us-east-1.amazonaws.com
            sdomains.splice(2, 1, "us-east-1");
            sdomains.splice(3, 1, "s3-website");
            //console.log("s3 matched 5");
        } else if (ssdomains.length > 1) { //matched  **.s3-[region].amazonaws.com
			if(ssdomains[0]!=="s3") return false;
			
            sdomains.splice(2, 1); //remove matched s3 region

            if (ssdomains.length == 0 && dp1 !== 0) {
                sdomains.splice(2, 0, "us-east-1");
            } else {
                if (ssdomains.length == 4 && dp1 !== 0) ssdomains.splice(0, 1); //remove s3 from region {
                sdomains.splice(2, 0, ssdomains.join("-")); //recreate the region without s3
            }

            //console.log(sdomains);
            if (dp3 == -1) sdomains.splice(3, 0, "s3");

            //console.log("s3 matched 5");
        } else if ((dp2 === 1 && dp3 === 2) && dp1 !== 0) {
            sdomains.splice(2, 0, "us-east-1");
            //console.log("s3 matched 6");
        } else return false;
		
        if(sdomains[2]!=="dualstack") sdomains.splice(3, 0, "dualstack");

        //matched china region, add the china tld back
        if (dp1 == 0) sdomains.splice(0, 0, "cn");

        //console.log(sdomains);
        var fixedhostname = sdomains.reverse().join(".");

        return fixedhostname;

    } else return false;
}

assert.equal(check_for_s3_hostname("s3.amazonaws.com"), "s3.dualstack.us-east-1.amazonaws.com");
assert.notEqual(check_for_s3_hostname("s3.amazonaws.com.cn"), "s3.dualstack.us-east-1.amazonaws.com.cn");

assert.equal(check_for_s3_hostname("redditstatic.s3.amazonaws.com"), "redditstatic.s3.dualstack.us-east-1.amazonaws.com");
assert.equal(check_for_s3_hostname("github-production-release-asset-2e65be.s3.amazonaws.com"), "github-production-release-asset-2e65be.s3.dualstack.us-east-1.amazonaws.com");
assert.equal(check_for_s3_hostname("2020awsreinvent.s3-us-west-2.amazonaws.com"), "2020awsreinvent.s3.dualstack.us-west-2.amazonaws.com");
assert.notEqual(check_for_s3_hostname("2020awsreinvent.s3-us-west-2.amazonaws.com.cn"), "2020awsreinvent.s3.dualstack.us-west-2.amazonaws.com.cn"); //china domain invalid region
assert.equal(check_for_s3_hostname("s3-accesspoint.us-east-2.amazonaws.com"), "s3-accesspoint.dualstack.us-east-2.amazonaws.com");

assert.equal(check_for_s3_hostname("s3-accelerate-speedtest.s3-accelerate.amazonaws.com"), "s3-accelerate-speedtest.s3-accelerate.dualstack.amazonaws.com");
assert.equal(check_for_s3_hostname("cheetah-test-us-east-1-02.s3-accelerate.amazonaws.com"), "cheetah-test-us-east-1-02.s3-accelerate.dualstack.amazonaws.com");
assert.notEqual(check_for_s3_hostname("s3-accelerate.amazonaws.com.cn"), "s3-accelerate.dualstack.amazonaws.com.cn"); //no dualstack domain

assert.equal(check_for_s3_hostname("s3.eu-central-1.amazonaws.com"), "s3.dualstack.eu-central-1.amazonaws.com");
assert.equal(check_for_s3_hostname("account-id.s3-control.eu-central-1.amazonaws.com"), "account-id.s3-control.dualstack.eu-central-1.amazonaws.com");
assert.equal(check_for_s3_hostname("s3-accesspoint.eu-central-1.amazonaws.com"), "s3-accesspoint.dualstack.eu-central-1.amazonaws.com");
assert.equal(check_for_s3_hostname("web.s3-accesspoint.eu-central-1.amazonaws.com"), "web.s3-accesspoint.dualstack.eu-central-1.amazonaws.com");

assert.equal(check_for_s3_hostname("s3.cn-north-1.amazonaws.com.cn"), "s3.dualstack.cn-north-1.amazonaws.com.cn");
assert.equal(check_for_s3_hostname("account-id.s3-control.cn-north-1.amazonaws.com.cn"), "account-id.s3-control.dualstack.cn-north-1.amazonaws.com.cn");
assert.equal(check_for_s3_hostname("web.s3-accesspoint.cn-north-1.amazonaws.com.cn"), "web.s3-accesspoint.dualstack.cn-north-1.amazonaws.com.cn");

assert.equal(check_for_s3_hostname("s3.ap-southeast-1.amazonaws.com"), "s3.dualstack.ap-southeast-1.amazonaws.com");
assert.equal(check_for_s3_hostname("account-id.s3-control.ap-southeast-1.amazonaws.com"), "account-id.s3-control.dualstack.ap-southeast-1.amazonaws.com");
assert.equal(check_for_s3_hostname("s3-accesspoint.ap-southeast-1.amazonaws.com"), "s3-accesspoint.dualstack.ap-southeast-1.amazonaws.com");
assert.equal(check_for_s3_hostname("web.s3-accesspoint.ap-southeast-1.amazonaws.com"), "web.s3-accesspoint.dualstack.ap-southeast-1.amazonaws.com");

assert.equal(check_for_s3_hostname("download.opencontent.netflix.com.s3.amazonaws.com"), "download.opencontent.netflix.com.s3.dualstack.us-east-1.amazonaws.com");

assert.equal(check_for_s3_hostname("s3-website-us-east-1.amazonaws.com"), "s3-website.dualstack.us-east-1.amazonaws.com");
assert.equal(check_for_s3_hostname("s3-website.ap-southeast-3.amazonaws.com"), "s3-website.dualstack.ap-southeast-3.amazonaws.com");
assert.notEqual(check_for_s3_hostname("s3-website.cn-northwest-1.amazonaws.com.cn"), "s3-website.dualstack.cn-northwest-1.amazonaws.com.cn"); //no dualstack domain

assert.equal(check_for_s3_hostname("pub-web-4b45fc8aac32a800.elb.eu-central-1.amazonaws.com"), false);
assert.equal(check_for_s3_hostname("cdn.assets.as2.amazonaws.com"), false);
assert.equal(check_for_s3_hostname("dynamodb.us-east-2.amazonaws.com"), false);

console.log("All Tests Passed")

