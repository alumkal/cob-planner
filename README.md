# 屋顶复用计算器

你要为植物大战僵尸制作一个屋顶炮复用计算器。项目基于Web环境，所有计算在用户的浏览器上进行。前端框架自行选择。

## 界面

应用包含两个界面：布阵和复用。

布阵页面会显示一个植物大战僵尸场地，场地的大小为5*9（行数可调，默认为5）。
用户可以点击场地上的空地添加一门炮，或者点击一门炮删除它。每个炮占据1行2列的空间。本项目中所有提到炮位置的地方均以炮的左部为准。

复用页面包含输入区和输出区。

游戏分成很多波，用户可以输入每一波的时长，以及波中的每次操作。

输入区以表格形式呈现，每一波对应三行：

- 第一行：时间
整数或javascript表达式；表达式可以包含变量w，w在求值时被替换为波长的值；表达式可以直接用Function求值，无需考虑用户的恶意输入。算出的值需要取整。
- 第二行：操作
有三种选项：发射、铲炮、种炮，发射选项还有一个额外参数，表示这门炮要求的列数。列数是一个或多个整数值或区间（如1~3 5）。
- 第三行：位置
位置包含行和列。行数的范围和场地行数相同；对于发射操作，列数的范围是0~9.9875，且是1/80的整数倍，对于铲种炮操作，列数的范围是1~8的整数。

效果大致如下：

| wave 1 | 时间: 300 | X | 时间: 300 | X |
| --- | --- | --- | --- | --- |
| 波长: | 发射 | 1-5 | 发射 | 5-8 |
| 601 | 2 | 9 | 4 | 9 |
| wave 2 | 时间: 0 | X | 时间: w-200 | X |
| 波长: | 种炮 |  | 发射 | 1 |
| 1000 | 3 | 4 | 3 | 8.0125 |

输入的时间是相对于波次的时间偏移，内部处理时需要将其转化为绝对时间。某一操作的绝对时间=前面所有波的波长之和+该操作在当前波的相对时间，比如上例中wave 3的-100的绝对时间是601+1000-100=1501。相对时间可以是负数，也可以大于波长。绝对时间不小于-600。

计算前，需要检查输入数据的合法性：

- 时间必须是整数
- 行数和列数在合法范围内
- 铲炮时该位置必须有炮
- 种炮时该位置不能和已有炮重叠

出错时，输入区对应的单元格背景变为红色，鼠标悬停时显示错误信息。

有一个“计算”按钮，按下后把所有输入区的操作送入复用求解器进行验证。验证前需要把所有操作的相对时间转为绝对时间，并把操作按绝对时间排序。需要记录排序前后的操作的对应关系，以便后续显示。

验证后，输入区中可满足的操作的背景变为绿色底，第一个无法满足的操作之后的操作变为红色底。当鼠标悬停在绿色底的发射操作上时，显示一个浮窗，显示这次发射被分配到炮的行数和列数，同时高亮相同行数和列数的上一次和下一次发射（如果有的话）。

如果所有炮都复用成功，额外显示一个表格，代表下次可用时间最早的8个炮（如果炮数不足8，允许一个炮在表格里出现多次，后一次出现时的可用时间比前一次晚3475）。表格的第一行显示炮的位置（形如1-3），第二行显示其相对于输入区最后一波的下一波的时间偏移。

UI布局和配色请自行决定，简洁美观即可。应提供深色主题和浅色主题。

用户输入的所有信息都应保存在Cookie中。页面上应有“打开”和“保存”按钮，支持把布阵和复用页面的所有输入存储到一个json文件中并读取回来。

## 复用求解器

### 输入

求解器接收的输入是以下内容：

- 初始时所有炮的位置列表。默认这些炮都可用
- 一系列操作

每个操作可以是：

- 发炮：发射一门t时刻落到(x, y)的炮，这门炮的列数必须在集合S中
- 铲炮：在t时刻铲掉(r, c)位置的炮
- 种炮：在t时刻在(r, c)位置种一门炮，保证此时这个位置没有炮

操作是有序的，时间可以为负。

求最大的n，使得存在完成前n次发炮操作的执行方案，并返回这个方案。

### 游戏机制

输入中给出的时间是炮的落地时间。每门炮从发射到落地有一定的延迟，这个延迟与炮的所在列和落点的列数有关。计算方式如下：

```cpp
int GetRoofFlyTime(int cobCol, float dropCol) {
    static constexpr std::pair<int, int> _flyTimeData[8] = {
        {515, 359},
        {499, 362},
        {515, 364},
        {499, 367},
        {515, 369},
        {499, 372},
        {511, 373},
        {511, 373},
    };
    int dropX = int(dropCol * 80);
    int minDropX = _flyTimeData[cobCol - 1].first;
    int minFlyTime = _flyTimeData[cobCol - 1].second;
    if (dropX >= minDropX)
        return minFlyTime;
    else
        return minFlyTime + 1 - (dropX - (minDropX - 1)) / 32;
}
```

对于一门炮，铲除时间-204及以后不可发射，种植时间+625之后可以发射，相邻两次发射间隔不小于3475。

### 约束

设函数Time(i, j) = ops[i].time - GetRoofFlyTime(cobs[j].col, ops[i].col)表示第i次发射使用第j门炮时，这门炮的发射时间。

把复用求解建模为一个SAT问题，使用npm库logic-solver求解。对于第i次发射和第j门炮（在同一个位置反复铲种时，每次种的炮视作不同的炮），如果Time(i, j)时刻该门炮有效（即已经种好且尚未被铲），且这门炮的列数满足该发射的列数要求，则向系统中添加变量a_ij，代表第i次发射使用的是第j门炮。

接下来，添加所有时间约束：对于每个变量a_ij，若变量a_kj存在且Time(i, j) < Time(k, j) < Time(i, j)+3475，则添加约束~a_ij or ~a_kj。

接下来，遍历所有发射操作i，逐个添加约束a_i1 or a_i2 or …（表示为每次操作至少分配一门炮）。若添加这个约束后不可满足，则终止并返回添加前的方案。

### 输出

复用求解器返回三个值：

- 能完成的发炮操作数量
- 对于每个完成的发炮操作，其使用的炮的行数和列数
- 炮位置→下次可用时间的map（下次可用时间=最后一次发射时间+3475+GetRoofFlyTime(炮列数, 9)；如果一门炮没被发射过，下次可用时间为0）

## 导出

计算成功后，用户可以将计算出的复用结果导出为代码。点击“导出”按钮后，弹出一个对话框，让用户选择导出格式。

目前只支持一种格式：

- AvZ2 DSL

其语法示例如下：

```cpp
OnWave(1) {
    // At 中的时间是相对于本波开始时间的偏移量
    At(100) RP(1, 1, 2, 9) & RP(1, 6, 4, 9), // 发射1-1的炮到2-9，1-6的炮到4-9
    // RP对应的时间是落地时间而非发射时间
    At(300) Card(ACOB_CANNON, 2, 1), // 在2-1种炮
    TrigAt(401) RP(3, 1, 2, 9) & RP(3, 6, 4, 9),
    // 波长-200时刻的At换成TrigAt；如果这一时刻没有操作，则生成一个At([波长-200]) Trig()
    At(600) Shovel(1, 1), // 铲1-1的炮
    // 含w的表达式替换为波长的值
    // 所有操作按时间排序，相同时间的操作用 & 连接
};

OnWave(2) {
    ...
};
```

你生成的代码不包括其中的注释。

导出对话框应包含一个代码框，显示生成的代码。用户可以复制代码到剪贴板。

