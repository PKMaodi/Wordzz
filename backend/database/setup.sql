USE master;
GO

IF DB_ID(N'Wordzz') IS NULL
  CREATE DATABASE Wordzz COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

USE Wordzz;
GO

IF OBJECT_ID(N'dbo.Words', N'U') IS NULL
  CREATE TABLE dbo.Words
  (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Words_Id DEFAULT NEWID(),
    Text NVARCHAR(30) NOT NULL,
    Type NVARCHAR(20) NOT NULL,
    CONSTRAINT PK_Words PRIMARY KEY NONCLUSTERED (Id),
    CONSTRAINT UQ_Words_Type_Text UNIQUE CLUSTERED (Type, Text),
    CONSTRAINT CK_Words_Type CHECK (Type IN (N'Noun', N'Verb', N'Adjective', N'Adverb', N'Pronoun', N'Preposition', N'Conjunction', N'Determiner', N'Exclamation'))
  );
GO

IF OBJECT_ID(N'dbo.Sentences', N'U') IS NULL
  CREATE TABLE dbo.Sentences
  (
    Id UNIQUEIDENTIFIER NOT NULL,
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Sentences_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Sentences_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Sentences PRIMARY KEY NONCLUSTERED (Id),
    INDEX IX_Sentences_CreatedAt CLUSTERED (CreatedAt)
  );
GO

IF OBJECT_ID(N'dbo.SentenceWords', N'U') IS NULL
  CREATE TABLE dbo.SentenceWords
  (
    SentenceId UNIQUEIDENTIFIER NOT NULL,
    Position INT NOT NULL,
    WordId UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_SentenceWords PRIMARY KEY (SentenceId, Position),
    CONSTRAINT FK_SentenceWords_Sentences FOREIGN KEY (SentenceId) REFERENCES dbo.Sentences (Id),
    CONSTRAINT FK_SentenceWords_Words FOREIGN KEY (WordId) REFERENCES dbo.Words (Id),
    CONSTRAINT CK_SentenceWords_Position CHECK (Position >= 0),
    INDEX IX_SentenceWords_WordId NONCLUSTERED (WordId)
  );
GO

INSERT INTO dbo.Words (Text, Type)
SELECT StarterWord.value, StarterWords.Type
FROM (VALUES
  (N'Noun', N'cat,dog,house,tree,book,friend,city,river,teacher,apple'),
  (N'Verb', N'run,eat,read,write,jump,sing,see,go,play,build'),
  (N'Adjective', N'happy,big,small,bright,quick,quiet,red,old,brave,kind'),
  (N'Adverb', N'quickly,slowly,happily,quietly,always,never,often,very,well,soon'),
  (N'Pronoun', N'I,you,he,she,it,we,they,me,us,them'),
  (N'Preposition', N'in,on,at,under,over,with,from,to,near,behind'),
  (N'Conjunction', N'and,but,or,so,because,although,while,if,yet,nor'),
  (N'Determiner', N'the,a,an,this,that,these,those,my,some,every'),
  (N'Exclamation', N'wow,oh,hooray,ouch,oops,hey,yay,alas,bravo,phew')
) AS StarterWords (Type, WordList)
CROSS APPLY STRING_SPLIT(StarterWords.WordList, N',') AS StarterWord
WHERE NOT EXISTS (
  SELECT 1
  FROM dbo.Words AS ExistingWord
  WHERE ExistingWord.Type = StarterWords.Type
    AND ExistingWord.Text = StarterWord.value
);
GO
