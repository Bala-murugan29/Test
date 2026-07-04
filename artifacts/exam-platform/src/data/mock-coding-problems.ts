import { CodingProblem } from '../types/coding.types';

export const codingProblems: CodingProblem[] = [
  // ─── exam001 ──────────────────────────────────────────────────────────────
  {
    id: 'cp001',
    examId: 'exam001',
    order: 1,
    title: 'Two Sum',
    difficulty: 'easy',
    marks: 20,
    timeLimit: '1s',
    memoryLimit: '256 MB',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice.

Return the answer in **any order**.`,
    inputFormat: `- First line: integer \`n\` (size of array)
- Second line: \`n\` space-separated integers
- Third line: integer \`target\``,
    outputFormat: `Two space-separated integers representing the 0-based indices.`,
    constraints: ['2 ≤ n ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', '-10⁹ ≤ target ≤ 10⁹', 'Exactly one valid answer exists'],
    examples: [
      { id: 'ex1', input: '4\n2 7 11 15\n9', expectedOutput: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { id: 'ex2', input: '3\n3 2 4\n6', expectedOutput: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
    ],
    hiddenTests: [
      { id: 'ht1', input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true },
      { id: 'ht2', input: '5\n1 5 3 2 9\n7', expectedOutput: '1 3', isHidden: true },
    ],
    starterCode: {
      c: `#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your solution here
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    // TODO: implement
    return result;
}

int main() {
    int n, target;
    scanf("%d", &n);
    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    scanf("%d", &target);
    int returnSize;
    int* result = twoSum(nums, n, target, &returnSize);
    printf("%d %d\\n", result[0], result[1]);
    free(nums); free(result);
    return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    unordered_map<int, int> mp;
    for (int i = 0; i < (int)nums.size(); i++) {
        int complement = target - nums[i];
        if (mp.count(complement)) return {mp[complement], i};
        mp[nums[i]] = i;
    }
    return {};
}

int main() {
    int n, target;
    cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    cin >> target;
    auto res = twoSum(nums, target);
    cout << res[0] << " " << res[1] << endl;
    return 0;
}`,
      python: `def two_sum(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

if __name__ == "__main__":
    n = int(input())
    nums = list(map(int, input().split()))
    target = int(input())
    result = two_sum(nums, target)
    print(result[0], result[1])`,
      java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // Write your solution here
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        int[] result = twoSum(nums, target);
        System.out.println(result[0] + " " + result[1]);
    }
}`,
    },
  },
  {
    id: 'cp002',
    examId: 'exam001',
    order: 2,
    title: 'Longest Common Subsequence',
    difficulty: 'medium',
    marks: 30,
    timeLimit: '2s',
    memoryLimit: '256 MB',
    description: `Given two strings \`text1\` and \`text2\`, return the **length** of their longest common subsequence. If there is no common subsequence, return \`0\`.

A **subsequence** of a string is a new string generated from the original by deleting some (possibly zero) characters without changing the relative order of the remaining characters.`,
    inputFormat: `- First line: string \`text1\`
- Second line: string \`text2\``,
    outputFormat: `A single integer — the length of the longest common subsequence.`,
    constraints: ['1 ≤ text1.length, text2.length ≤ 1000', 'Strings contain only lowercase English letters'],
    examples: [
      { id: 'ex1', input: 'abcde\nace', expectedOutput: '3', explanation: '"ace" is the LCS of length 3.' },
      { id: 'ex2', input: 'abc\nabc', expectedOutput: '3', explanation: '"abc" is the LCS.' },
      { id: 'ex3', input: 'abc\ndef', expectedOutput: '0', explanation: 'No common subsequence.' },
    ],
    hiddenTests: [
      { id: 'ht1', input: 'oxcpqrsvwf\nshmtulqrypy', expectedOutput: '2', isHidden: true },
      { id: 'ht2', input: 'bsbininm\njmjkbkjkv', expectedOutput: '1', isHidden: true },
    ],
    starterCode: {
      c: `#include <stdio.h>
#include <string.h>

int lcs(char* s1, char* s2) {
    int m = strlen(s1), n = strlen(s2);
    int dp[1001][1001];
    for (int i = 0; i <= m; i++) {
        for (int j = 0; j <= n; j++) {
            if (i == 0 || j == 0) dp[i][j] = 0;
            else if (s1[i-1] == s2[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
            else dp[i][j] = dp[i-1][j] > dp[i][j-1] ? dp[i-1][j] : dp[i][j-1];
        }
    }
    return dp[m][n];
}

int main() {
    char s1[1001], s2[1001];
    scanf("%s %s", s1, s2);
    printf("%d\\n", lcs(s1, s2));
    return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int lcs(string& s1, string& s2) {
    int m = s1.size(), n = s2.size();
    vector<vector<int>> dp(m+1, vector<int>(n+1, 0));
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = s1[i-1] == s2[j-1] ? dp[i-1][j-1]+1 : max(dp[i-1][j], dp[i][j-1]);
    return dp[m][n];
}

int main() {
    string s1, s2;
    cin >> s1 >> s2;
    cout << lcs(s1, s2) << endl;
    return 0;
}`,
      python: `def lcs(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]

text1 = input().strip()
text2 = input().strip()
print(lcs(text1, text2))`,
      java: `import java.util.*;

public class Main {
    public static int lcs(String s1, String s2) {
        int m = s1.length(), n = s2.length();
        int[][] dp = new int[m+1][n+1];
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                dp[i][j] = s1.charAt(i-1) == s2.charAt(j-1)
                    ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j], dp[i][j-1]);
        return dp[m][n];
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s1 = sc.next(), s2 = sc.next();
        System.out.println(lcs(s1, s2));
    }
}`,
    },
  },
  {
    id: 'cp003',
    examId: 'exam001',
    order: 3,
    title: 'Validate Balanced Parentheses',
    difficulty: 'easy',
    marks: 20,
    timeLimit: '1s',
    memoryLimit: '128 MB',
    description: `Given a string \`s\` containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is **valid**.

A string is valid if:
1. Open brackets are closed by the same type of brackets.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket.`,
    inputFormat: `A single line containing the bracket string \`s\`.`,
    outputFormat: `Print \`true\` if valid, otherwise \`false\`.`,
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of bracket characters only'],
    examples: [
      { id: 'ex1', input: '()', expectedOutput: 'true' },
      { id: 'ex2', input: '()[]{}\n', expectedOutput: 'true' },
      { id: 'ex3', input: '(]', expectedOutput: 'false' },
    ],
    hiddenTests: [
      { id: 'ht1', input: '{[()]}', expectedOutput: 'true', isHidden: true },
      { id: 'ht2', input: '([)]', expectedOutput: 'false', isHidden: true },
    ],
    starterCode: {
      c: `#include <stdio.h>
#include <string.h>

int isValid(char* s) {
    char stack[10001];
    int top = -1;
    for (int i = 0; s[i]; i++) {
        char c = s[i];
        if (c=='(' || c=='{' || c=='[') stack[++top] = c;
        else {
            if (top < 0) return 0;
            char t = stack[top--];
            if (c==')' && t!='(') return 0;
            if (c=='}' && t!='{') return 0;
            if (c==']' && t!='[') return 0;
        }
    }
    return top == -1;
}

int main() {
    char s[10001];
    scanf("%s", s);
    printf("%s\\n", isValid(s) ? "true" : "false");
    return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c=='(' || c=='{' || c=='[') st.push(c);
        else {
            if (st.empty()) return false;
            char t = st.top(); st.pop();
            if (c==')' && t!='(') return false;
            if (c=='}' && t!='{') return false;
            if (c==']' && t!='[') return false;
        }
    }
    return st.empty();
}

int main() {
    string s; cin >> s;
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}`,
      python: `def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            if not stack or stack[-1] != mapping[char]:
                return False
            stack.pop()
        else:
            stack.append(char)
    return not stack

s = input().strip()
print("true" if is_valid(s) else "false")`,
      java: `import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char c : s.toCharArray()) {
            if (c=='(' || c=='{' || c=='[') stack.push(c);
            else {
                if (stack.isEmpty()) return false;
                char t = stack.pop();
                if (c==')' && t!='(') return false;
                if (c=='}' && t!='{') return false;
                if (c==']' && t!='[') return false;
            }
        }
        return stack.isEmpty();
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.next();
        System.out.println(isValid(s) ? "true" : "false");
    }
}`,
    },
  },

  // ─── exam002 ───────────────────────────────────────────────────────────────
  {
    id: 'cp004',
    examId: 'exam002',
    order: 1,
    title: 'Fibonacci Sequence',
    difficulty: 'easy',
    marks: 20,
    timeLimit: '1s',
    memoryLimit: '128 MB',
    description: `Print the **n-th Fibonacci number** (0-indexed).

The Fibonacci sequence is defined as:
- F(0) = 0
- F(1) = 1  
- F(n) = F(n-1) + F(n-2) for n > 1`,
    inputFormat: `A single integer \`n\`.`,
    outputFormat: `The n-th Fibonacci number.`,
    constraints: ['0 ≤ n ≤ 50'],
    examples: [
      { id: 'ex1', input: '5', expectedOutput: '5', explanation: 'F(5) = 0,1,1,2,3,5 → 5' },
      { id: 'ex2', input: '10', expectedOutput: '55' },
    ],
    hiddenTests: [
      { id: 'ht1', input: '0', expectedOutput: '0', isHidden: true },
      { id: 'ht2', input: '1', expectedOutput: '1', isHidden: true },
      { id: 'ht3', input: '30', expectedOutput: '832040', isHidden: true },
    ],
    starterCode: {
      c: `#include <stdio.h>

long long fib(int n) {
    // Write your solution here
    if (n <= 1) return n;
    long long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long long c = a + b; a = b; b = c;
    }
    return b;
}

int main() {
    int n; scanf("%d", &n);
    printf("%lld\\n", fib(n));
    return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

long long fib(int n) {
    if (n <= 1) return n;
    long long a = 0, b = 1;
    for (int i = 2; i <= n; i++) {
        long long c = a + b; a = b; b = c;
    }
    return b;
}

int main() {
    int n; cin >> n;
    cout << fib(n) << endl;
    return 0;
}`,
      python: `def fib(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

n = int(input())
print(fib(n))`,
      java: `import java.util.*;

public class Main {
    public static long fib(int n) {
        if (n <= 1) return n;
        long a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            long c = a + b; a = b; b = c;
        }
        return b;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(fib(sc.nextInt()));
    }
}`,
    },
  },
  {
    id: 'cp005',
    examId: 'exam002',
    order: 2,
    title: 'Merge Intervals',
    difficulty: 'medium',
    marks: 30,
    timeLimit: '1s',
    memoryLimit: '256 MB',
    description: `Given an array of intervals where \`intervals[i] = [start_i, end_i]\`, merge all **overlapping** intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    inputFormat: `- First line: integer \`n\` (number of intervals)
- Next \`n\` lines: two space-separated integers \`start end\``,
    outputFormat: `Each merged interval on its own line as \`start end\`.`,
    constraints: ['1 ≤ n ≤ 10⁴', '0 ≤ start ≤ end ≤ 10⁴'],
    examples: [
      { id: 'ex1', input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', explanation: '[1,3] and [2,6] overlap → [1,6].' },
      { id: 'ex2', input: '2\n1 4\n4 5', expectedOutput: '1 5', explanation: '[1,4] and [4,5] are adjacent → [1,5].' },
    ],
    hiddenTests: [
      { id: 'ht1', input: '1\n5 5', expectedOutput: '5 5', isHidden: true },
      { id: 'ht2', input: '3\n1 10\n2 6\n8 9', expectedOutput: '1 10', isHidden: true },
    ],
    starterCode: {
      c: `#include <stdio.h>
#include <stdlib.h>

int cmp(const void* a, const void* b) {
    return ((int*)a)[0] - ((int*)b)[0];
}

int main() {
    int n; scanf("%d", &n);
    int intervals[10001][2];
    for (int i = 0; i < n; i++) scanf("%d %d", &intervals[i][0], &intervals[i][1]);
    qsort(intervals, n, sizeof(intervals[0]), cmp);
    int merged[10001][2], m = 0;
    merged[0][0] = intervals[0][0]; merged[0][1] = intervals[0][1];
    for (int i = 1; i < n; i++) {
        if (intervals[i][0] <= merged[m][1]) {
            if (intervals[i][1] > merged[m][1]) merged[m][1] = intervals[i][1];
        } else { m++; merged[m][0] = intervals[i][0]; merged[m][1] = intervals[i][1]; }
    }
    for (int i = 0; i <= m; i++) printf("%d %d\\n", merged[i][0], merged[i][1]);
    return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<pair<int,int>> v(n);
    for (auto& p : v) cin >> p.first >> p.second;
    sort(v.begin(), v.end());
    vector<pair<int,int>> res;
    for (auto& p : v) {
        if (!res.empty() && p.first <= res.back().second)
            res.back().second = max(res.back().second, p.second);
        else res.push_back(p);
    }
    for (auto& p : res) cout << p.first << " " << p.second << "\\n";
    return 0;
}`,
      python: `def merge_intervals(intervals):
    intervals.sort()
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

n = int(input())
intervals = [list(map(int, input().split())) for _ in range(n)]
for s, e in merge_intervals(intervals):
    print(s, e)`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[][] intervals = new int[n][2];
        for (int i = 0; i < n; i++) { intervals[i][0]=sc.nextInt(); intervals[i][1]=sc.nextInt(); }
        Arrays.sort(intervals, (a, b) -> a[0] - b[0]);
        List<int[]> res = new ArrayList<>();
        res.add(intervals[0]);
        for (int i = 1; i < n; i++) {
            if (intervals[i][0] <= res.get(res.size()-1)[1])
                res.get(res.size()-1)[1] = Math.max(res.get(res.size()-1)[1], intervals[i][1]);
            else res.add(intervals[i]);
        }
        for (int[] r : res) System.out.println(r[0] + " " + r[1]);
    }
}`,
    },
  },
  {
    id: 'cp006',
    examId: 'exam002',
    order: 3,
    title: 'Binary Search',
    difficulty: 'easy',
    marks: 15,
    timeLimit: '1s',
    memoryLimit: '128 MB',
    description: `Given a **sorted** array of integers and a target value, return the **index** of the target using binary search. If the target is not found, return \`-1\`.`,
    inputFormat: `- First line: integer \`n\`
- Second line: \`n\` sorted space-separated integers
- Third line: integer \`target\``,
    outputFormat: `A single integer — the 0-based index, or \`-1\` if not found.`,
    constraints: ['1 ≤ n ≤ 10⁴', 'Array is sorted in ascending order'],
    examples: [
      { id: 'ex1', input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4' },
      { id: 'ex2', input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1' },
    ],
    hiddenTests: [
      { id: 'ht1', input: '1\n5\n5', expectedOutput: '0', isHidden: true },
      { id: 'ht2', input: '3\n1 2 3\n4', expectedOutput: '-1', isHidden: true },
    ],
    starterCode: {
      c: `#include <stdio.h>

int binarySearch(int* nums, int n, int target) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

int main() {
    int n; scanf("%d", &n);
    int nums[10001];
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    int target; scanf("%d", &target);
    printf("%d\\n", binarySearch(nums, n, target));
    return 0;
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int& x : nums) cin >> x;
    int target; cin >> target;
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) { cout << mid << endl; return 0; }
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    cout << -1 << endl;
    return 0;
}`,
      python: `def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

n = int(input())
nums = list(map(int, input().split()))
target = int(input())
print(binary_search(nums, target))`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        int lo = 0, hi = n - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) { System.out.println(mid); return; }
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        System.out.println(-1);
    }
}`,
    },
  },
];

export const getCodingProblemsByExamId = (examId: string): CodingProblem[] =>
  codingProblems.filter((p) => p.examId === examId);

export const getCodingProblemById = (id: string): CodingProblem | undefined =>
  codingProblems.find((p) => p.id === id);
