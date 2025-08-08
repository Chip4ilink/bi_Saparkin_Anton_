create table [bi].[BusinessUnit] (
	[ID] int not null identity (1, 1),
	[Code] varchar(63) not null,
	[Name] varchar(255) not null,
	[MDT_DateCreate] datetime not null constraint [DF_BusinessUnit_MDT_DateCreate] default (getdate()),
	[MDT_ID_PrincipalCreatedBy] int not null constraint [DF_BusinessUnit_MDT_ID_PrincipalCreatedBy] default ([mdt].[ID_User]()),
	constraint [PK_BusinessUnit] primary key clustered ([ID] asc),
	constraint [FK_BusinessUnit_MDT_ID_PrincipalCreatedBy_Principal] foreign key ([MDT_ID_PrincipalCreatedBy]) references [mdt].[Principal] ([ID]) on delete no action on update no action,
	constraint [UK_BusinessUnit_Code] unique nonclustered ([Code] asc)
);