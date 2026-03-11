import ast
from engine.rules   import get_rule
from engine.scoring import BASELINE_COMPUTE_UNITS, PER_LINE_WEIGHT

# ==========================================================
# MASTER ANALYZER
# ==========================================================

def analyze_code(code: str):
    """
    Analyze Python code for inefficiency patterns.
    Compute Units never return 0 — even clean code
    has a baseline execution cost.
    """
    issues = []

    try:
        tree = ast.parse(code)
    except SyntaxError:
        return {
            "issues": [{"message": "Invalid Python code", "line": None}],
            "total_operation_weight": BASELINE_COMPUTE_UNITS
        }

    # Baseline weight — every line of code costs something
    line_count  = code.count("\n") + 1
    base_weight = BASELINE_COMPUTE_UNITS + (line_count * PER_LINE_WEIGHT)

    detectors = [
        detect_nested_loops,
        detect_inefficient_membership,
        detect_object_creation_in_loop
    ]

    for detector in detectors:
        issues.extend(detector(tree))

    # Deduplicate by (rule_id, line)
    seen   = set()
    unique = []
    for issue in issues:
        key = (issue["rule_id"], issue["line"])
        if key not in seen:
            seen.add(key)
            unique.append(issue)

    penalty_weight = sum(i.get("weight", 0) for i in unique)
    total_weight   = round(base_weight + penalty_weight, 2)

    return {
        "issues":                 unique,
        "total_operation_weight": total_weight,
        "baseline_weight":        round(base_weight, 2),
        "penalty_weight":         round(penalty_weight, 2)
    }


# ==========================================================
# R1 – Nested Loop Detection
# ==========================================================

def detect_nested_loops(tree):
    issues = []
    SMALL_RANGE_THRESHOLD = 5

    for node in ast.walk(tree):
        if isinstance(node, ast.For):
            for child in node.body:
                if isinstance(child, ast.For):

                    # Skip small constant-range inner loops
                    if isinstance(child.iter, ast.Call):
                        func = child.iter.func
                        if isinstance(func, ast.Name) and func.id == "range":
                            args = child.iter.args
                            if (len(args) == 1
                                    and isinstance(args[0], ast.Constant)
                                    and args[0].value <= SMALL_RANGE_THRESHOLD):
                                continue

                    rule = get_rule("R1")
                    issues.append({
                        "rule_id":    "R1",
                        "title":      rule["rule_name"],
                        "suggestion": rule["suggestion"],
                        "line":       child.lineno,
                        "weight":     rule["base_operation_weight"],
                        "severity":   rule["severity"]
                    })

    return issues


# ==========================================================
# R2 – Inefficient Membership Check Inside Loop
# ==========================================================

def detect_inefficient_membership(tree):
    issues         = []
    variable_types = {}

    # Step 1: Track variable assignments
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    if isinstance(node.value, ast.List):
                        variable_types[target.id] = "list"
                    elif isinstance(node.value, ast.Set):
                        variable_types[target.id] = "set"

    # Step 2: Flag list membership checks inside loops
    for node in ast.walk(tree):
        if isinstance(node, ast.For):
            for child in ast.walk(node):
                if isinstance(child, ast.Compare):
                    if isinstance(child.ops[0], ast.In):
                        comparator = child.comparators[0]
                        if isinstance(comparator, ast.Name):
                            if variable_types.get(comparator.id) == "list":
                                rule = get_rule("R2")
                                issues.append({
                                    "rule_id":    "R2",
                                    "title":      rule["rule_name"],
                                    "suggestion": rule["suggestion"],
                                    "line":       child.lineno,
                                    "weight":     rule["base_operation_weight"],
                                    "severity":   rule["severity"]
                                })

    return issues


# ==========================================================
# R3 – Constant Object Creation Inside Loop
# FIX: report the FOR loop's line number, not the child node
# ==========================================================

def detect_object_creation_in_loop(tree):
    issues = []

    for node in ast.walk(tree):
        if isinstance(node, ast.For):

            for child in ast.walk(node):

                # Constant list or set inside loop
                if isinstance(child, (ast.List, ast.Set)):
                    if (len(child.elts) > 0
                            and all(isinstance(e, ast.Constant) for e in child.elts)):
                        rule = get_rule("R3")
                        issues.append({
                            "rule_id":    "R3",
                            "title":      rule["rule_name"],
                            "suggestion": rule["suggestion"],
                            "line":       node.lineno,   # ← FOR loop line, not child
                            "weight":     rule["base_operation_weight"],
                            "severity":   rule["severity"]
                        })

                # Constant dict inside loop
                if isinstance(child, ast.Dict):
                    if all(
                        isinstance(k, ast.Constant) and isinstance(v, ast.Constant)
                        for k, v in zip(child.keys, child.values)
                    ):
                        rule = get_rule("R3")
                        issues.append({
                            "rule_id":    "R3",
                            "title":      rule["rule_name"],
                            "suggestion": rule["suggestion"],
                            "line":       node.lineno,   # ← FOR loop line, not child
                            "weight":     rule["base_operation_weight"],
                            "severity":   rule["severity"]
                        })

    return issues