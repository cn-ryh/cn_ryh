#include <bits/stdc++.h>
using namespace std;
int a[10000001];
int main()
{
    for(int i = 1;i <= 1000000000;i++)
    {
        a[i] = i;
    }
    for(int i = 1200099011;i;i--)
    {
        printf("%d\n",a[i]);
    }
    return 0;
}
