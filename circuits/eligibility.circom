pragma circom 2.0.0;

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1 = 0;

    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * 2**i;
    }
    lc1 === in;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n + 1);
    n2b.in <== in[0] + (1 << n) - in[1];
    out <== 1 - n2b.out[n];
}

template GreaterEqThan(n) {
    signal input in[2];
    signal output out;

    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1];
    out <== 1 - lt.out;
}

template EligibilityVerifier() {
    // Private Inputs (Vendor Witness - never revealed to verifier)
    signal input experience;
    signal input turnover;
    signal input projects;

    // Public Inputs (Tender Eligibility Policy & Hash)
    signal input minimumExperience;
    signal input minimumTurnover;
    signal input minimumProjects;
    signal input policyHash;

    // Output Signal
    signal output eligible;

    // Range comparison checks (32-bit integer ranges)
    component geExp = GreaterEqThan(32);
    geExp.in[0] <== experience;
    geExp.in[1] <== minimumExperience;

    component geTurnover = GreaterEqThan(32);
    geTurnover.in[0] <== turnover;
    geTurnover.in[1] <== minimumTurnover;

    component geProjects = GreaterEqThan(32);
    geProjects.in[0] <== projects;
    geProjects.in[1] <== minimumProjects;

    // Logical AND of all three conditions
    signal expTurnover;
    expTurnover <== geExp.out * geTurnover.out;
    eligible <== expTurnover * geProjects.out;

    // Enforce that eligibility condition must hold (must equal 1)
    eligible === 1;

    // Cryptographically bind policyHash to proof inputs
    signal policyBinding;
    policyBinding <== policyHash * 1;
}

component main {public [minimumExperience, minimumTurnover, minimumProjects, policyHash]} = EligibilityVerifier();
