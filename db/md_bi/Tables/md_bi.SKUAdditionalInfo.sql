create table [md_bi].[SKUAdditionalInfo] (
	[ID] int not null,
	[ID_bi_BusinessUnit] int not null,
	[MDT_DateCreate] datetime not null constraint [DF_SKUAdditionalInfo_MDT_DateCreate] default (getdate()),
	[MDT_ID_PrincipalCreatedBy] int not null constraint [DF_BusinessUnit_MDT_ID_PrincipalCreatedBy] default ([mdt].[ID_User]()),
	constraint [PK_SKUAdditionalInfo] primary key clustered ([ID] asc),
	constraint [FK_SKUAdditionalInfo_BI_BusinessUnit] foreign key ([ID_bi_BusinessUnit]) references [bi].[BusinessUnit] ([ID]) on delete no action on update no action,
	constraint [FK_SKUAdditionalInfo_MD_SKU] foreign key ([ID]) references [md].[SKU] ([ID]) on delete no action on update no action,
	constraint [FK_SKUAdditionalInfo_MDT_ID_PrincipalCreatedBy_Principal] foreign key ([MDT_ID_PrincipalCreatedBy]) references [mdt].[Principal] ([ID]) on delete no action on update no action
);